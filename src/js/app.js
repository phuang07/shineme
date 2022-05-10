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
                console.log(textract_res)
                textract_res = [...new Set(textract_res)]

                console.log(textract_res)
  
                let id = pic_info.id
                for (let i = 0; i < textract_res.length - 1; i++) {
                  // use fixed id=1 since it doesn't affect the result
                  let integer = parseInt(textract_res[i])
                  var uuid_each = uuidv4()
                  console.log(uuid_each)
                  let data_2_insert = {
                      "id": 888,
                      "bib": integer,   
                      "url": pic_info['pic-url'],
                      "photographer": "JaRa"
                    }
                  
                  entry = {}
                  entry[uuid_each] = data_2_insert
                  App.updateStore(entry)
                  // send subscription email
                  // post to azure pub/sub service
                  await fetch(App.EMAIL_GENERATE_EVENT, {
                    method: 'POST',
                    body: {
                      "message_topic": "new_picture",
                      "message_bib": textract_res[i]
                    }
                  }).then(res => console.log(res))

                }
                
                // let pts = App.gun.get('photos2')
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
    photos = App.gun.get('photos2');
    
    photos.map().once((data) => {
      console.log(data);
      App.updatePhotoGrid(data);
    });
  },

  updateStore: function(data) {
    App.gun.get('photos2').put(data);
  },

  updatePhotoGrid: function(data) {
    console.log(data.bib);
    if (data.bib == undefined) {
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
    Row.append(Template.html());

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
    
    return App.initContract();
  },

  initContract: function() {

    // $.getJSON('Adoption.json', function(data) {
    //   // Get the necessary contract artifact file and instantiate it with @truffle/contract
    //   var AdoptionArtifact = data;
    //   App.contracts.Adoption = TruffleContract(AdoptionArtifact);
    
    //   // Set the provider for our contract
    //   App.contracts.Adoption.setProvider(App.web3Provider);
    
    //   // Use our contract to retrieve and mark the adopted pets
    //   return App.markAdopted();
    // });
    

    $.getJSON('PhotoPurchase.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with @truffle/contract
      var Artifact = data;
      App.contracts.PhotoPurchase = TruffleContract(Artifact);
    
      // Set the provider for our contract
      App.contracts.PhotoPurchase.setProvider(App.web3Provider);
    
      // Use our contract to retrieve and mark the adopted pets
      // return App.markAdopted();
      return App.markPurchased();
    });


    return App.bindEvents();
  },

  bindEvents: function() {
    // $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('click', '.btn-purchase', App.handlePurchase);
  },

  // markAdopted: function() {
  //   var adoptionInstance;

  //   App.contracts.Adoption.deployed().then(function(instance) {
  //     adoptionInstance = instance;

  //     return adoptionInstance.getAdopters.call();
  //   }).then(function(adopters) {
  //     for (i = 0; i < adopters.length; i++) {
  //       if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
  //         $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
  //       }
  //     }
  //   }).catch(function(err) {
  //     console.log(err.message);
  //   });

  // },

  markPurchased: function() {
    var purchaseInstance;

    App.contracts.PhotoPurchase.deployed().then(function(instance) {
      purchaseInstance = instance;

      return purchaseInstance.getRunners.call();
    }).then(function(runners) {
      for (i = 0; i < runners.length; i++) {
        if (runners[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-runner').eq(i).find('button').text('Success').attr('disabled', true);
        }
      }
    }).catch(function(err) {
      console.log(err.message);
    });

  },

  // handleAdopt: function(event) {
  //   event.preventDefault();

  //   var petId = parseInt($(event.target).data('id'));
  //   var adoptionInstance;

  //   web3.eth.getAccounts(function(error, accounts) {
  //     if (error) {
  //       console.log(error);
  //     }
    
  //     var account = accounts[0];
  //     console.log(account);
  //     console.log(App.contracts);
  //     App.contracts.Adoption.deployed().then(function(instance) {
  //       adoptionInstance = instance;
    
  //       // Execute adopt as a transaction by sending account
  //       return adoptionInstance.adopt(petId, {from: account});
  //     }).then(function(result) {
  //       return App.markAdopted();
  //     }).catch(function(err) {
  //       console.log(err.message);
  //     });
  //   });
    
  // },

  handlePurchase: function(event) {
    event.preventDefault();

    var bib_number = parseInt($(event.target).data('id'));
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
        return purchaseInstance.purchase(bib_number, {from: account});
      }).then(function(result) {
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
