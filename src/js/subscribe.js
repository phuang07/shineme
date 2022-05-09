function bib_clearMessage() {
    $('#form_message').text("");
}

function bib_subscribe() {
    console.log("submitting request...");
    let data = {
        subject: "subject",
        body: "body",
        email: $('#form_email').val(),
        message_bib: $('#form_bib').val(),
        message_topic: "new_picture"
    };
    fetch("https://prod-82.eastus.logic.azure.com:443/workflows/2687816bb8f144e58278d6c20edda944/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=nHSTjPggiwzfwtzwiThDa5Nkle40awMixV27-Lbz2JU", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => {
        console.log("response received.");
        if (res.ok) $('#form_message').text("Successfully subscribed! You will receive an email when your picture is ready.");
        else $('#form_message').text("Something went wrong, please try again.");
    });
    return false;
}


$('#collapsible').on("click", function(){
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    if (content.style.display === "block") {
        content.style.display = "none";
    } else {
        content.style.display = "block";
    }
});

$('#form_bib').on('input', bib_clearMessage);
$('#form_email').on('input', bib_clearMessage);