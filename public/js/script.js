function submit_form() {
    var form = document.getElementById("search_form").onkeydown = function (e) {
        if (e.which === 13) {
            form.submit();
        }
    }
}

function showDiv() {
    document.getElementById('logout-div').style.display = "block";
    document.getElementById('modal').style.display = "block";
}

function showDeleteDiv(){
    document.getElementById('delete-div').style.display = "block";
    document.getElementById('delete-modal').style.display = "block";
}

