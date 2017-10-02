
chatModule = function () {

    //Init variables
    var loginBtn = $("#login_button"),
        loginPage = $("#login_page"),
        loginError = $("#login_error"),
        usernameInput = $("#login_usernameInput"),
        chatUsers = $("#chat_userslist"),
        chatMessage = $("#chat_message"),
        chatWindow = $("#chat_window"),
        loggedIn = false,
        username = "_default";

    /* Function declarations */
    var getLoggedIn = function () { return loggedIn; };
    var getUsername = function () { return username; };

    // Adds a message to the page
    function insertMessage(username, message) {
        $('#chat_window').prepend('<p><strong>' + username + '</strong> ' + message + '</p>');
    }

    /* Update user list and count */
    function updateUserInfo(numUsers, usersArray) {
        updateUserCounter(numUsers);
        chatUsers.empty();
        returnUsernames(usersArray);
        //console.log(usersArray);
    }

    //Update the counter of the total number of users
    function updateUserCounter(numUsers) {
        $('#chat_count').text(numUsers);
    }

    //Print all users
    function returnUsernames(usersArray) {
        for (var i = 0; i < usersArray.length; i++) {
            chatUsers.prepend('<p><strong>' + usersArray[i] + '</strong></p>');
        }
    }

    //Set up the login page to fill chat window
    function setupLoginPage() {
        let chatWindow = $("#chat_window"),
            chatWindowWidth = parseInt(chatWindow.css("width"), 10),
            width = chatWindowWidth * 0.80,
            marginLeft = chatWindowWidth * 0.09;

        //console.log(width);
        loginPage.css('width', width + 'px');
        loginPage.css('margin-left', marginLeft + 'px');
    }

    //Filter text inputs
    function filterText(input) {
        return $('<div/>').text(input).html();
    }

    /*Submit username*/
    function submitUsername() {
        username = filterText(usernameInput.val().trim());
        usernameInput.val("");

        ///put in some filtering for bad usernames
        document.title = username + ' - ' + document.title;
        loginPage.fadeOut();

        chatMessage.removeAttr("disabled").focus();
        loggedIn = true;
    }

    /* When Submit button is clicked */
    function submitEvent() {
        if (!loggedIn) {
            loginPage.css('visibility', 'visible');
            chatMessage.attr("disabled", "disabled");
            chatModule.setupLoginPage();
            usernameInput.focus();
        }
        else {
            var message = chatMessage.val();

            if (message.trim().length > 0) {
                socket.emit('message', message); //Send the message to the server
                insertMessage(username, message);
                chatMessage.val('').focus();
            }
        }

        return false; // Blocks 'classic' sending of the form
    }

    return {
        submitUsername: submitUsername,
        updateUserInfo: updateUserInfo,
        insertMessage: insertMessage,
        setupLoginPage: setupLoginPage,
        submitEvent: submitEvent,
        loginBtn: loginBtn, //vars
        chatWindow: chatWindow,
        usernameInput: usernameInput,
        username: username,
        getLoggedIn: getLoggedIn,
        getUsername: getUsername
    };
}();

// Connecting to socket.io
var socket = io.connect('http://localhost:8080');

//Ask the server for the list of user names
socket.emit('begin new session', chatModule.username);

socket.on('init new session', function (data) {
    chatModule.updateUserInfo(data.numUsers, data.usersArray);
});

// When a message is received it's inserted in the page
socket.on('message', function (data) {
    chatModule.insertMessage(data.username, data.message);
});

// When a new client connects, the information is displayed
socket.on('client joined', function (data) {
    chatModule.chatWindow.prepend('<p><em>' + data.username + ' has joined the chat!</em></p>');
    chatModule.updateUserInfo(data.numUsers, data.usersArray);
});

socket.on('login', function (data) {
    chatModule.updateUserInfo(data.numUsers, data.usersArray);
});

socket.on('client left', function (data) {
    chatModule.chatWindow.prepend('<p><em>' + data.username + ' has left the chat!</em></p>');
    chatModule.updateUserInfo(data.numUsers, data.usersArray);
});


/* Click events */
chatModule.loginBtn.click(function () {
    chatModule.submitUsername();
    socket.emit('client joined', chatModule.getUsername());
});

/* Keyboard events */
chatModule.usernameInput.keypress(function (e) {
    if (e.which === 13) {
        chatModule.submitUsername();
        socket.emit('client joined', chatModule.getUsername());
    }
});

/* Event listeners */
$('#chat_form').on("submit", chatModule.submitEvent);
