App = {
  
  web3Provider: null,
  contracts: {},
  photos: {},
  MAX_IMAGE_SIZE: 5000000,
  gun: Gun(['shineme1.us-south.cf.appdomain.cloud', 'https://gun-manhattan.herokuapp.com/gun']),
  upload_image: null,
  API_ENDPOINT:'https://9kc7jq1mp2.execute-api.us-east-1.amazonaws.com/default/getPresignedURL',
  TEXTRACT_ENDPOINT:'https://bikodailzb.execute-api.us-east-1.amazonaws.com/default/insert_image_info',
  EMAIL_GENERATE_EVENT:'https://prod-77.eastus.logic.azure.com:443/workflows/dc63a65e6a3c4772b195f55452f9c7cd/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=50PFp4e81NW1ojJRU-N2t9BNTRuRdkMQm0CIEIeH4T4',
  
  init: async function() {
    // Set up gun.js
    App.setupGunjs();
    // const upload_file = document.getElementById("upload-image");
    const upload_btn = document.getElementById("upload-button");
    
    // save temp file
    // upload_file.addEventListener("click", function(data) {
      
    // })
    var blobData;
    // upload file to S3 and insert data into gun js database
    upload_btn.addEventListener("click", async function(e) {  
      if (App.upload_image == null) {
        alert("no file chosen");
        return;
      }
      console.log(App.upload_image);
      // request S3 upload URI
      var presignedURL;
      await fetch(App.API_ENDPOINT, {
        method: 'GET'
      }).then(response => {
        resp_body = response.text()
        resp_body.then((res)=>{
          presignedURL = res
        }).then(function() {
          console.log(presignedURL)
          let binary = atob(App.upload_image.split(',')[1])
          let array = []
          for (var i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i))
          }
          blobData = new Blob([new Uint8Array(array)], {type: 'image/jpeg'})
        }).then(async function() {
          // upload to s3
          presignedURL = JSON.parse(presignedURL)
          await fetch(presignedURL['uploadURL'], {
            method: 'PUT',
            body: blobData
          }).then(res => console.log("upload result", res)).then(async function() {
            var resp_body
            var textract_res
            
            
            var image_url = presignedURL['uploadURL'].split('?')[0];

            var pic_info =  {
              "uuid": uuidv4(),
              "pic-url": image_url,
              "uploader": "Jara",
              "uploader-id": 0
            }

            await fetch(App.TEXTRACT_ENDPOINT, {
              method: 'POST',
              body: JSON.stringify(pic_info)
            }).then((response) => {
              resp_body = response.json()
              resp_body.then((res)=>{
                // console.log(res)
                textract_res = res
              }).then(async function() {
                pic_info.bibs = textract_res
                // remove duplicates in textract result
                textract_res = [...new Set(textract_res)]

                console.log("detected texts: " + textract_res);
  
                let id = pic_info.id
                // create photo_ID for this image
                let photo_ID = Math.floor(Math.random() * 500)
                for (let i = 0; i < textract_res.length; i++) {
                  // use fixed id=1 since it doesn't affect the result
                  let integer = parseInt(textract_res[i])
                  var uuid_each = uuidv4()
                  var uploader_name = $("#form_uploader").val();
                  // console.log(uuid_each)
                  let data_2_insert = {
                      "id": photo_ID,
                      "bib": integer,   
                      "url": pic_info['pic-url'],
                      "photographer": uploader_name,
                      "eth_address" : web3.eth.accounts[0]
                  }
                  entry = {}
                  entry[uuid_each] = data_2_insert
                  App.updateStore(entry)
                  // send subscription email
                  // post to azure pub/sub service
                  email_generate_event_body = {
                    "message_topic": "new_picture",
                    "message_bib": textract_res[i]
                  }
                  await fetch(App.EMAIL_GENERATE_EVENT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(email_generate_event_body)
                  }).then(res => console.log(res))

                }
                
                // let pts = App.gun.get('photos3')
                // pts.map().once((e) => {
                //   console.log(e);
                // });

              })
            })
          })
        })
      })

      
      // console.log('Response: ', S3_result.data)
      
      
      
      // console.log('Result: ', result)
      // Final URL for the user doesn't need the query string params
      // use this to link pic info in dynamodb

    })
    
    return await App.initWeb3();
  },

  createImage: function(file) {
    let reader = new FileReader()
    reader.onload = (e) => {
      console.log('length: ', e.target.result.includes('data:image/jpeg'))
      if (!e.target.result.includes('data:image/jpeg')) {
        return alert('Wrong file type - JPG only.')
      }
      if (e.target.result.length > App.MAX_IMAGE_SIZE) {
        return alert('Image is loo large - 5Mb maximum')
      }
      App.upload_image = e.target.result
    }
    reader.readAsDataURL(file)
  },
  

  setupGunjs: function() {
    photos = App.gun.get('photos3');
    
    photos.map().once((data) => {
      console.log(data);
      App.updatePhotoGrid(data);
    });
  },

  updateStore: function(data) {
    console.log(data);
    App.gun.get('photos3').put(data);
  },

  updatePhotoGrid: function(data) {   
    if (data == undefined || data.bib == undefined) {
      return;
    };

    var Row = $('#runnersRow');
    var Template = $('#runnerTemplate').clone();

    Template.find('.bib').addClass('bib-' + data.bib);
    Template.find('.panel-title').text(data.bib);
    Template.find('img').attr('src', data.url);
    Template.find('.photographer').text(data.photographer);
    Template.find('.runner-bib').text(data.bib);
    Template.find('.btn-purchase').attr('data-id', data.id);
    Template.find('.btn-purchase').attr('data-address', data.eth_address);
    Template.find('.btn-purchase').attr('data-url', data.url);

    if(purchased[data.id]){
      Template.find('.btn-purchase').text('Purchased').attr('disabled', true);
    }

    Row.prepend(Template.html());

  },

  initWeb3: async function() {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.request({ method: "eth_requestAccounts" });;
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    window.ethereum.enable();

    window.ethereum.on('accountsChanged', function (accounts) {
      $('#detected_eth_account').text(accounts[0]);
    })
    $('#detected_eth_account').text(web3.eth.accounts[0]);

    return App.initContract();
  },

  initContract: function() {

    $.getJSON('PhotoPurchase.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with @truffle/contract
      var Artifact = data;
      App.contracts.PhotoPurchase = TruffleContract(Artifact);
    
      // Set the provider for our contract
      App.contracts.PhotoPurchase.setProvider(App.web3Provider);
  
      return App.markPurchased();
    });


    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-purchase', App.handlePurchase);
  },

  markPurchased: function() {
    var purchaseInstance;

    App.contracts.PhotoPurchase.deployed().then(function(instance) {
      purchaseInstance = instance;
      return purchaseInstance.getRunners.call();
    }).then(function(runners) {     
      console.log("updating purchased items")
      for (i = 0; i < runners.length; i++) {
        if (runners[i] !== '0x0000000000000000000000000000000000000000') {
          console.log("purchased items found: " + i);
          purchased[i] = true;
          $('.btn-purchase[data-id=' + i + ']').text('Purchased').attr('disabled', true);
        }
      }
    }).catch(function(err) {
      console.log(err.message);
    });

  },

  handlePurchase: function(event) {
    event.preventDefault();

    var photo_id = parseInt($(event.target).data('id'));
    var address = $(event.target).data('address');
    var url = $(event.target).data('url');
    console.log("eth will be sent to " + address);
    var purchaseInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
    
      var account = accounts[0];
      console.log(account);
      console.log(App.contracts);
      App.contracts.PhotoPurchase.deployed().then(function(instance) {
        purchaseInstance = instance;
        // Execute purchase as a transaction by sending account
        console.log("purchase is pending...");
        return purchaseInstance.purchase(photo_id, address, {from: account, value: web3.toWei(0.01, 'ether')});
      }).then(function(result) {
        console.log("purchased");
        window.open(url,'_blank');
        return App.markPurchased();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
    
  },

  addSearchListener: function(e) {
    $('#bib-search').on('click', function(e){
      e.preventDefault();

      var bib = $('#input-bib').val();
      console.log('bib is: ' + bib);
      
      if(bib == '') { $('.bib').show(); return } 

      $('.bib').show();
      $('.bib').each(function(index, val){
        if (!$(val).hasClass('bib-' + bib)) {
          $(val).hide();
        }
      });

    });


    $('#input-bib').on('keyup', function(e){
      e.preventDefault();

      var bib = $('#input-bib').val();
      console.log('bib is: ' + bib);
      
      if(bib == '') { $('.bib').show(); return } 

      $('.bib').show();
      $('.bib').each(function(index, val){
        if (!$(val).hasClass('bib-' + bib)) {
          $(val).hide();
        }
      });

    });



  }

};


function saveImage(file) {
  const files = file.files;
  App.createImage(files[0])
  console.log(App.upload_image)
}

$(function() {
  $(window).load(function() {
    App.init();
    App.addSearchListener();
  });
});
