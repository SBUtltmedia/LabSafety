var quizfile = "json/quiz.json";
var mediaDir = "media/";
var ogfile = mediaDir + "video.ogv";
var mp4file = mediaDir + "video.m4v";
var questions;
var times = [];
var lastTime = 0;
var checkCounter = 0;
var pause = [];
var countSet = 10;
var currentQuestion = -1;
var video;
var scrubbing = false;
var showingQuestion = false;
var answerData = [];
var disableClicks = false;
var letterPanels = [];
var letterFlipInterval = -1;
var quizComplete = false;
var questionToggleEnabled = false;
var showingQuestions = true;
var lastSaved = new Date().getTime();
var lastWatched = new Date().getTime();
var recordedCompletion = false;
var permissionData = {};
var canView = false;
var userScore = 0;
var idleCheck;
try {
    var urlVars = getUrlVars();
    var progress = new Progress(urlVars["local"]);
} catch (e) {
}

function clearCookies() {
    console.log(document.cookie + "s");
    document.cookie.split(";").forEach(function (c) {
        console.log(c)
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
}
var watchStart = 0;

var userData = {
    "watchData": [],
    "attempts": [],
    "answerData": [],
    "bestScore": 0,
    "dataVersion": 1
};

$(document).ready(function () {
    getPermissions();
    resizeWindow();
    checkForLTI()
    $("#fullScreenButton").click(function () {
        setTimeout(function () {
            resizeWindow();
        }, 800);
    });
});

function checkForLTI() {
    if (document.referrer.match(/blackboard/i) && !inframe() && !ses) {
        alert("You appear to be coming from a link in Blackboard but we did not get the proper informanion to submit a grade, if you are expecting a grade, pleae try revisitng the link from Blackboard again")
    }


}

function getPermissions() {	// Called by 1 function: onload()
    $.ajax({
        dataType: "json",
        url: "json/permissions.json",
        data: "",
        success: function (data) {
            permissionData = data;
            if (permissionData.cannotReset) {
                console.log(permissionData.cannotReset)
                $("div[id^='resetQuestion']").remove();
            }
            if (permissionData.isPublic) {

                // Quiz is public
                $("#userInfoButton").css("display", "none");
                $("#quiz").css("visibility", "visible");
                $("#blocker").css("visibility", "hidden");
                canView = true;
                loadButtons();
            } else {
                // Quiz is not public
                $("#userInfoButton").css("display", "auto");
                getUserData();
            }
        },
        error: function () {
            permissionData = {
                "isPublic": false
            }
            // Quiz is not public
            $("#userInfoButton").css("display", "auto");
            getUserData();
        }
    });
}

function getUserData() {	// Called by 1 function: getPermissions()
    $.ajax({
        dataType: "json",
        url: "loadUserData.php",
        error: function () { location.reload() },
        success: function (data) {
            console.log(data)
            if (Object.keys(data).length > 0) {
                userData = data;
            }
            if (userData.watchData == null) {
                userData.watchData = [];
            }
            if (userData.attempts == null) {
                userData.attempts = [];
            }
            if (userData.answerData == null) {
                userData.answerData = [];
            }
            if (userData.responses == null) {
                userData.responses = {};
            }
            if (userData.dataVersion != 1) {
                userData.dataVersion = 1;
            }
            loadUserData();
            loadButtons();
            updateScore();
        }
    });
}

function loadUserData() {	// Called by 2 functions: getUserData() & completeQuiz()
    canView = false;
    if (permissionData.isPrivate != true) {
        canView = true;
    } else {
        for (var i = 0; i < permissionData.canAccessData.length; i++) {
            if (permissionData.canAccessData[i] == userData.netID) {
                canView = true;
            }
        }
        for (var i = 0; i < permissionData.canViewQuiz.length; i++) {
            if (permissionData.canViewQuiz[i] == userData.netID) {
                canView = true;
            }
        }
        if (window.location.href.indexOf(userData.netID) != -1) {
            canView = true;
        }
    }
    if (canView) {
        // Allowed to view video quiz
        $("#quiz").css("visibility", "visible");
        $("#blocker").css("visibility", "hidden");
        $("#userInfoLogin").text("Signed in as " + userData.nickname + " " + userData.lastname + " (" + userData.netID + ").");
        if (userData.attempts.length > 0) {
            $("#userInfoComplete").text("You have already completed this quiz.");
            quizComplete = true;
            $("#userInfoButton").addClass("anim_hexSpin");
            questionToggleEnabled = true;
        } else if (quizComplete) {
            $("#userInfoComplete").text("You have just completed this quiz.");
            $("#userInfoButton").addClass("anim_hexSpin");
            questionToggleEnabled = false;
        } else {
            $("#userInfoComplete").text("You have not completed this quiz yet.");
            questionToggleEnabled = false;
        }
        // Disabled question hiding (there is currently no point to it).
        if (questionToggleEnabled && false) {
        } else {
            $("#toggleQuestionButton").css("visibility", "hidden");
        }
        // lol
        if (userData.netID == "japalmeri") {
            $("#playbackSpeed").append('<option value="5">5x</option>');
        }
    } else {
        // Not allowed to view video quiz
        $("#quiz").css("visibility", "hidden");
        $("#blocker").css("visibility", "visible");
    }
    updateScore();
}

function loadButtons() {	// Called by 2 functions: getPermissions() & getUserData()
    $.ajax({
        dataType: "json",
        url: quizfile,
        data: "",
        success: function (data) {
            questions = data;
            if (userData.answerData.length < questions.questions.length || userData.answerData.length > questions.questions.length) {
                updateUser();
                function updateUser() {
                    userData.answerData = [];
                    for (var i = 0; i < questions.questions.length; i++) {
                        var qr = {
                            "answers": [],
                            "correct": false,
                            "score": 0
                        };
                        userData.answerData.push(qr);
                    }
                }
            }
            prepQuestionScreen();
            $(window).keydown(function (e) {
                // Enter key pressed
                if (e.which == 13) {
                    if ($("#fillInAnswer").val().length != 0) {
                        submitTextAnswer($("#fillInAnswer").val());
                    }
                }
            });

            if (permissionData.isPublic) {
                loadLocalData();
            }

            // Video controls
            video = $("#videoBox")[0];

            setInitialVolume();
            video.addEventListener('onchange', function (evt) { console.log(evt) })
            video.addEventListener("loadedmetadata", cconce);						//	Tony
            if (video.readyState >= 2) cconce(); // Tony https://stackoverflow.com/questions/33116067/addeventlistenerloadedmetadata-fun-doesnt-run-correctly-firefox-misses-eve
            $('#cc').on('click', togglecc);
            //togglecc();						//	Tony

            $('#bigPlay').click(playPause);											//	Paul
            $('#quizBank').hide();													//	Tony
            $("#videoPlayPause").click(function () {
                playPause();
                //video.textTracks[0].mode = "showing";	//	Tony
            });
            $("#seekSlider").change(function () {
                console.log("change");
                vidSeek();
            });
            $("#seekSlider").on("mousedown touchstart", function () {

                console.log("down");
                scrubbing = true;
            });
            $("#muteButton").click(function () {
                videoMute();
            });
            $("#volumeSlider").change(function () {
                setVolume();
            });
            //$('#cc').on("click",setVolume)
            $("body").on("mouseup touchend", function () {
                if (scrubbing) {
                    scrubbing = false;
                }
            });
            setInterval(function () {
                if (!scrubbing) {
                    seekTimeUpdate();
                }
            }, 200);
            if (questions.questions.length > 0) {
                // There are questions
                makeQuestionButtons();
                $("#noQuestionText").css("opacity", 0);
            } else {
                // No questions
                $("#noQuestionText").css("opacity", 1);
            }

            // Initialize wrong answer recording
            if (questions.questions.length > 0 && userData.answerData.length == 0) {
                for (var i = 0; i < questions.questions.length; i++) {
                    var qr = {
                        "answers": [],
                        "correct": false,
                        "score": 0
                    };
                    userData.answerData.push(qr);
                }
            }

            for (var i = 0; i < userData.answerData.length; i++) {
                if (userData.answerData[i].correct) {
                    animateAnswerCorrect(i);
                }
            }

            if (checkFinished()) {
                setTimeout(function () {
                    completeQuiz();
                }, 1000);
            }

            // Check if metadata has loaded
            if (video.readyState == 1) {
                setTimeout(metadataLoaded, 20);
                metadataLoaded();
            } else {
                video.addEventListener('loadedmetadata', function () {
                    metadataLoaded();
                });
            }

            // Check if video has loaded
            if (canView) {
                if (video.readyState > 3) {
                    // setTimeout(playPause, 20);	//	Paul
                    metadataLoaded();
                } else {
                    video.addEventListener('loadeddata', function () {
                        metadataLoaded();
                    });
                }
            }

            video.onended = function () {
                videoEnded();
            };

            $("#playbackSpeed").change(function () {
                video.playbackRate = $("#playbackSpeed").val();
            });

            $("title").text(questions.title);
            $("#quizTitle").text(questions.title);

            $("#userInfoButton").hover(function () {
                $("#userInfoBox").removeClass("anim_quickFadeOut");
                $("#userInfoBox").addClass("anim_quickFadeIn");
            }, function () {
                $("#userInfoBox").removeClass("anim_quickFadeIn");
                $("#userInfoBox").addClass("anim_quickFadeOut");
            });

            $("#toggleQuestionButton").click(function () {
                if (questionToggleEnabled) {
                    if (showingQuestions) {
                        hideQuestions();
                    } else {
                        showQuestions();
                    }
                }
            });

            $("#toggleQuestionButton").hover(function () {
                $("#toggleQuestionBox").removeClass("anim_quickFadeOut");
                $("#toggleQuestionBox").addClass("anim_quickFadeIn");
            }, function () {
                $("#toggleQuestionBox").removeClass("anim_quickFadeIn");
                $("#toggleQuestionBox").addClass("anim_quickFadeOut");
            });

            $("#resetQuestionButton").click(function () {

                if (confirm("This will reset your quiz score and allow you to take it again, continue?")) {
                    resetQuestions();
                }
            });

            $("#resetQuestionButton").hover(function () {
                $("#resetQuestionBox").removeClass("anim_quickFadeOut");
                $("#resetQuestionBox").addClass("anim_quickFadeIn");
            }, function () {
                $("#resetQuestionBox").removeClass("anim_quickFadeIn");
                $("#resetQuestionBox").addClass("anim_quickFadeOut");
            });
            $("#videoSkip").hover(function () {
                $("#videoSkipBox").removeClass("anim_quickFadeOut");
                $("#videoSkipBox").addClass("anim_quickFadeIn");
            }, function () {
                $("#videoSkipBox").removeClass("anim_quickFadeIn");
                $("#videoSkipBox").addClass("anim_quickFadeOut");
            });

            if (questions.questions.length == 0) {
                $("#toggleQuestionButton").css("display", "none");
                $("#toggleQuestionBox").css("display", "none");
                $("#resetQuestionButton").css("display", "none");
                $("#resetQuestionBox").css("display", "none");
            }

            $('#videoSkip').on("click", jumpToUnwatched).trigger("click");

            $("#expoButtonReview").click(function () {
                questionReview();
            });

            $("#expoButtonRetry").click(function () {
                questionRetry();
            });

            $("#expoButtonContinue").click(function () {
                questionContinue();
            });

            $("#hideQuestionButton").click(function () {
                $(".answerBox div").css({ "pointer-events": "none" });
                minimizeQuestionPanel();
            });

            $("#showQuestionButton").click(function () {
                $(".answerBox div").css({ "pointer-events": "all" });
                maximizeQuestionPanel();
            });

            $("#hideQuestionButton").hover(function () {
                $("#hideQuestionButtonLabel").removeClass("anim_quickFadeOut");
                $("#hideQuestionButtonLabel").addClass("anim_quickFadeIn");
            }, function () {
                $("#hideQuestionButtonLabel").removeClass("anim_quickFadeIn");
                $("#hideQuestionButtonLabel").addClass("anim_quickFadeOut");
            });

            $("#showQuestionButton").hover(function () {
                $("#showQuestionButtonLabel").removeClass("anim_quickFadeOut");
                $("#showQuestionButtonLabel").addClass("anim_quickFadeIn");
            }, function () {
                $("#showQuestionButtonLabel").removeClass("anim_quickFadeIn");
                $("#showQuestionButtonLabel").addClass("anim_quickFadeOut");
            });

            $("#scoreBox").hover(function () {
                $("#scoreInfo").removeClass("anim_quickFadeOut");
                $("#scoreInfo").addClass("anim_quickFadeIn");
            }, function () {
                $("#scoreInfo").removeClass("anim_quickFadeIn");
                $("#scoreInfo").addClass("anim_quickFadeOut");
            });

            $("body").keydown(function (event) {
                // C key pressed.
                if (event.which == 67) {
                    //clearLocalData();
                }
            });

            setVolume();
            resizeWindow();
            updateScore();
        }
    });
}

function togglecc() {			//	Tony
    $('#cc').toggleClass('on');
    $("video")[0].textTracks[0].mode = $("#cc").hasClass('on') ? 'showing' : 'hidden';
    $('#repair,#repairBox').toggle()

}

function cconce() {				//	Tony
    //	https://iandevlin.com/blog/2015/02/javascript/dynamically-adding-text-tracks-to-html5-video/
    //track.src = "media/video.vtt";																	//	Tony
    addTrack()
    //track.addEventListener("load", function() {
    //	this.mode = "showing";
    //	video.textTracks[0].mode = "showing"; // thanks Firefox 35.0.1
    //});
    togglecc();
    $('#repairBox form').on("submit", submitRepair)
    $('#repairBox form textarea').on('focus', pauseVideo)

}

function addTrack() {
    $("video track").remove();
    track = document.createElement("track");
    track.default = "default";
    track.kind = "captions";
    track.label = "English";
    track.srclang = "en";

    $("video")[0].appendChild(track);

    /*
       var video_author = window.location.toString().split('/').reverse();									//	Tony
       if(video_author.indexOf("bookMaker") > -1){     //Rahul
       $("video track").attr("src","media/video.vtt");
       }else{
       $("video track").attr("src","/vq/vqLib/DAL/?vtt&author=" + video_author[2] + "&quizid=" + video_author[1]);              //      Tony
       }
       */
    $("video track").attr("src", "getVTT.php");
    $($("video")[0].textTracks[0]).on('cuechange', populateRepair);

}


function populateRepair() {
    var activeCue = $("video")[0].textTracks[0].activeCues[0]
    if (activeCue) {
        $("#repairBox form textarea").val(activeCue.text);
        $("#repairBox form #startTime").val(activeCue.startTime);
    }
}


function submitRepair() {
    var text = $("#repairBox form textarea").val();
    var startTime = $("#repairBox form #startTime").val();
    if (startTime) {
        console.log($("video")[0].textTracks[0].activeCues[0]);
        $.post('saveUserData.php', { data: { text, startTime } }, function (response) {
            video.currentTime = startTime - 1;
            addTrack()
            playVideo();
            console.log(response);
        })
    }


}



function metadataLoaded() {	// Called by 1 function: loadButtons()
    if (userData.watchData[0] == null) {
        userData.watchData = [];
        for (var i = 0; i <= video.duration; i++) {
            userData.watchData.push(0);
        }
    }
    for (var i = 0; i < questions.questions.length; i++) {
        let markerWidth = parseFloat($("#questionMarker" + i).css("width")) / parseFloat($("#questionMarkers").width()) * 100
        console.log(markerWidth)
        $("#questionMarker" + i).css("left", (questions.questions[i].startTime / (video.duration) * 100) - markerWidth / 2 + "%");
    }
}

// Better than parseInt() in that it detects the first integer in a string even if it starts with something that is not a number.  Still returns NaN if no integers are found.
function betterParseInt(s) {	// Called by 0 functions:
    var str = s + "";
    while (isNaN(parseInt(str)) && str.length > 0) {
        str = str.substring(1, str.length);
    }
    return parseInt(str);
}

function prepQuestionScreen() {	// Called by 1 function: loadButtons()
    for (var i = 0; i < 6; i++) {
        $("#questionBoxContents").append("<div id='answerBox" + i + "' class='answerBox text fs-20'></div>");
        $("#answerBox" + i).append("<div id='answerIcon" + i + "' class='answerIcon btn'></div>");
        $("#answerBox" + i).append("<div id='answerText" + i + "' class='answerText'></div>");
        $("#answerBox" + i).css("top", (37.5 + 10 * i) + "%");
        initAnswerClickEvent(i);
    }
    for (var i = 0; i < 100; i++) {
        $("#fillInPanels").append('<div id="fillInPanel' + i + '" class="fillInPanel">');
        $("#fillInPanel" + i).append('<div id="fillInPanelText' + i + '" class="fillInPanelText text fs-36"></div>')
    }
    resizeWindow();
}

function initAnswerClickEvent(i) {	// Called by 1 function: prepQuestionScreen()
    $("#answerBox" + i + " div").click(function () {
        selectAnswer(i);
    });
}

function selectAnswer(n) {	// Called by 1 function: initAnswerClickEvent()
    if (showingQuestion && userData.answerData[currentQuestion].answers.indexOf(n) == -1) {
        var q = questions.questions[currentQuestion];
        answerData[currentQuestion][n] = true;
        userData.answerData[currentQuestion].answers.push(n);
        var isCorrect = false;
        if (q.correctAnswer == n + 1) {
            answerCorrect(n);
            isCorrect = true;
        } else {
            answerIncorrect(n);
        }

        // Fade out non-selected answers
        for (var i = 0; i < 6; i++) {
            if (i != n) {
                $("#answerBox" + i).addClass("anim_answerFadeOut");
            }
        }
        // Animate correct answer to the top
        $("#answerBox" + n).addClass("anim_answerToTop");

        // Show expository text
        if (questions.questions[currentQuestion].expoText === undefined) {
            $("#expoText").text(isCorrect ? "Good job!" : "Not quite...");
        } else {
            if (questions.questions[currentQuestion].expoText[n] == "") {
                $("#expoText").text(isCorrect ? "Good job!" : "Not quite...");
            } else {
                $("#expoText").text(questions.questions[currentQuestion].expoText[n]);
            }
        }
        setTimeout(function () {
            $("#expoBox").addClass("anim_expoFadeIn");
        }, 600);

        saveWatchData();
    }
}

function answerCorrect(n) {	// Called by 3 functions: selectAnswer(), submitFillAnswer() & submitShortResponse
    // Correct answer :D
    var t = questions.questions[currentQuestion].type;
    if (t == "mc") {
        $("#answerIcon" + n).removeClass("anim_spinButton");
        $("#answerIcon" + n).removeClass("iconCorrect");
        $("#answerIcon" + n).removeClass("iconWrong");
        setTimeout(function () {
            $("#answerIcon" + n).addClass("anim_spinButton");
            $("#answerIcon" + n).addClass("iconCorrect");
        }, 25);
    } else if (t == "fitb") {
        revealAllLetters();
        $("#fillInAnswer").blur();
    }
    animateAnswerCorrect(currentQuestion);
    var numTries = userData.answerData[currentQuestion].answers.length;
    userData.answerData[currentQuestion].correct = true;
    userData.answerData[currentQuestion].score = Math.pow(.75, numTries - 1);
    // Check if finished
    if (checkFinished()) {
        setTimeout(function () {
            completeQuiz();
        }, 1200);
    }
    $("#expoTitle").text("Correct");
    $("#expoTitle").css("color", "#2cb674");
    $("#expoText").css("color", "#2cb674");
    $("#expoButtonReview").css("visibility", "hidden");
    $("#expoButtonRetry").css("visibility", "hidden");
    $("#expoButtonContinue").css("visibility", "visible");
    // Update score
    var oldScore = userScore;
    updateScore();
    var pointsEarned = userScore - oldScore;
    $("#scoreBubbleText").text("+" + pointsEarned);
    $("#scoreBubble").removeClass("anim_scoreBubbleIn");
    setTimeout(function () {
        $("#scoreBubble").addClass("anim_scoreBubbleIn");
    }, 25);
}

function animateAnswerCorrect(n) {	// Called by 2 functions: loadButtons() & answerCorrect()
    $("#questionButton" + n).removeClass("anim_spinButton");
    setTimeout(function () {
        $("#questionButton" + n).addClass("anim_spinButton");
        setTimeout(function () {
            $("#questionButtonText" + n).text("");
            $("#questionButtonIcon" + n).removeClass("iconWrong");
            $("#questionButtonIcon" + n).addClass("iconCorrect");
        }, 62.5);
    }, 25);
    $("#questionMarker" + n).addClass("anim_foldQuestionMarker");
}

function answerIncorrect(n) {	// Called by 2 functions: selectAnswer() & submitFillAnswer()
    // Wrong answer :(
    var t = questions.questions[currentQuestion].type;
    $("#questionButtonText" + currentQuestion).text("");
    $("#questionButton" + currentQuestion).removeClass("anim_spinButton");
    setTimeout(function () {
        $("#questionButton" + currentQuestion).addClass("anim_spinButton");
        setTimeout(function () {
            $("#questionButtonIcon" + currentQuestion).removeClass("iconCorrect");
            $("#questionButtonIcon" + currentQuestion).addClass("iconWrong");
        }, 62.5);
    }, 25);
    if (t == "mc") {
        $("#answerIcon" + n).removeClass("anim_spinButton");
        $("#answerIcon" + n).removeClass("iconCorrect");
        $("#answerIcon" + n).removeClass("iconWrong");
        setTimeout(function () {
            $("#answerIcon" + n).addClass("anim_spinButton");
            $("#answerIcon" + n).addClass("iconWrong");
        }, 25);
    } else if (t == "fitb") {
        $("#fillInAnswer").blur();
        //        $("#fillInAnswer").addClass("anim_fillInAnswerIncorrect");
        //        setTimeout(function () {
        //            $("#fillInAnswer").removeClass("anim_fillInAnswerIncorrect");
        //        }, 1000);
    }
    $("#expoTitle").text("Incorrect");
    $("#expoTitle").css("color", "#eb2529");
    $("#expoText").css("color", "#eb2529");
    $("#expoButtonReview").css("visibility", "visible");
    $("#expoButtonRetry").css("visibility", "visible");
    $("#expoButtonContinue").css("visibility", "visible");
}

function questionReview() {	// Called by 1 function: loadButtons()
    hideQuestionPanel();
    if (questions.questions[currentQuestion].wrongTimeSet) {
        video.currentTime = questions.questions[currentQuestion].wrongTime;
        currentQuestion = -1;
    }
    setTimeout(function () {
        playVideo();
    }, 250);
}

function questionRetry() {	// Called by 1 function: loadButtons()
    setQuestion(currentQuestion);
}

function questionContinue() {	// Called by 1 function: loadButtons()
    hideQuestionPanel();
    setTimeout(function () {
        playVideo();
    }, 250);
}

function checkFinished() {	// Called by 2 functions: loadButtons() & answerCorrect()
    if (userData.answerData.length > 0) {
        for (var i = 0; i < userData.answerData.length; i++) {
            if (!userData.answerData[i].correct) {
                return false;
            }
        }
        return true;
    }
    else {
        var seconds = 0;
        //*pstdenis changed to handle watchData longer than duration
        //for (var i=0; i<userData.watchData.length; i++) {
        for (var i = 0; i < video.duration; i++) {
            if (userData.watchData[i] > 0) {
                seconds++;
            }
        }
        //if (seconds > .8 * userData.watchData.length) {
        if (seconds > .8 * video.duration) {
            return true;
        }
        return false;
    }
}

function completeQuiz() {	// Called by 3 functions: loadButtons(), answerCorrect() & recordTimeWatched()
    var n = questions.questions.length;
    if (n == 1) {
        exitButton(0, 500);
    } else {
        for (var i = 0; i < n; i++) {
            exitButton(i, i * (500 / (n - 1)));
        }
    }
    var mistakes = 0;
    for (var i = 0; i < n; i++) {
        mistakes += (userData.answerData[i].answers.length - 1);
    }
    if (mistakes == 0 && permissionData.isPublic != true) {
        $("#gameCompleteText").text("You answered all the questions without any mistakes! Perfect!");
    } else {
        $("#gameCompleteText").text("You answered all the questions.");
    }
    $("#gameCompleteText").html($("#gameCompleteText").text() + "<br> Keep watching for full credit!")
    if (n > 0) {
        // There are some questions
        setTimeout(function () {
            $("#gameCompleteText").addClass("anim_gameCompleteTextShow");
        }, 1250);
    } else {
        // No questions
    }

    if (permissionData.isPublic == true) {
        setTimeout(function () {
            $("#resetQuestionButton").css("visibility", "visible");
            $("#resetQuestionButton").removeClass("anim_resetQuestionHide");
            $("#resetQuestionButton").addClass("anim_resetQuestionShow");
        }, 2000);
    }
    if (!userData.completeDate) {
        userData.completeDate = new Date();
    }
    if (!userData.firstQuizScore && userData.quizScore) {
        userData.firstQuizScore = userData.quizScore;
    }
    quizComplete = true;
    $("#noQuestionText").css({ "opacity": 1 });
    if (permissionData.isPublic != true) {
        loadUserData();
    }
    saveUserData();
    saveLocalData();
}

function resetQuestions() {	// Called by 2 functions: loadButtons() & completeQuiz()

    $("#gameCompleteText").removeClass("anim_gameCompleteTextShow");
    /* turned off for Ete 2020 */
    for (var i = 0; i < userData.answerData.length; i++) {
        userData.answerData[i].answers = [];
        userData.answerData[i].correct = false;
        userData.answerData[i].score = 0;
        $("#questionButtonText" + i).text("" + (i + 1));
    }

    $(".questionButton").removeClass("anim_buttonExit");
    $(".questionButton").removeClass("anim_spinButton");
    $(".questionButtonIcon").removeClass("iconCorrect");
    $(".questionButtonIcon").removeClass("iconWrong");
    $(".questionMarker").removeClass("anim_foldQuestionMarker");
}

function exitButton(i, delay) {	// Called by 1 function: completeQuiz()
    setTimeout(function () {
        $("#questionButton" + i).addClass("anim_buttonExit");
    }, delay);
}

function urlify(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function (url) {
        return '<a href="' + url + '">' + url + '</a>';
    })
    // or alternatively
    // return text.replace(urlRegex, '<a href="$1">$1</a>')
}

function setQuestion(n) {	// Called by 2 functions: questionRetry() & initQuestionClickEvent
    if (!userData.answerData[n].correct && showingQuestions) {
        // Hide expository text

        $("#expoBox").removeClass("anim_expoFadeIn");
        $("#expoButtonReview").css("visibility", "hidden");
        $("#expoButtonRetry").css("visibility", "hidden");
        $("#expoButtonContinue").css("visibility", "hidden");
        $(".answerBox").removeClass("anim_answerFadeOut");
        $(".answerBox").removeClass("anim_answerToTop");

        if (!showingQuestion) {
            showQuestionPanel();
        }
        pauseVideo();
        currentQuestion = n;
        //$("#questionText").text(questions.questions[n].questionText);
        $("#questionText").html(urlify((n + 1) + '. ' + questions.questions[n].questionText));	//	Tony
        $("#smallQuestionText").text(questions.questions[n].questionText);
        //        $(".answerIcon").removeClass("anim_spinCorrect");
        //        $(".answerIcon").removeClass("anim_spinWrong");
        $(".answerIcon").removeClass("anim_spinButton");
        $(".answerIcon").removeClass("iconCorrect");
        $(".answerIcon").removeClass("iconWrong");
        $("#fillInAnswer").val("");
        clearInterval(letterFlipInterval);
        $(".anim_letterPanelSpin").removeClass("anim_letterPanelSpin");
        var t = questions.questions[n].type;

        //Dynamic Size Fixes
        $("#questionText").removeClass("srFix");

        if (t == "mc") {
            $(".fillInPanel").css("opacity", 0);
            $(".fillInPanel").css("pointer-events", "none");
            $("#fillInAnswer").css("opacity", 0);
            $("#fillInAnswer").css("pointer-events", "none");
            for (var i = 0; i < 6; i++) {
                console.log(i, questions.questions[n].answerText[i])
                if (questions.questions[n].answerText[i]) {
                    $("#answerText" + i).text(questions.questions[n].answerText[i]);
                    $("#answerBox" + i).css("opacity", 1);
                    $("#answerBox" + i).css("pointer-events", "all");
                } else {
                    $("#answerText" + i).text("");
                    $("#answerBox" + i).css("opacity", 0);
                    $("#answerBox" + i).css("pointer-events", "none");
                }
                var answerChosen = answerData[currentQuestion][i]; // Old way
                answerChosen = (userData.answerData[currentQuestion].answers.indexOf(i) != -1);
                if (answerChosen) {
                    if (questions.questions[currentQuestion].correctAnswer == i + 1) {
                        $("#answerIcon" + i).addClass("iconCorrect");
                    } else {
                        $("#answerIcon" + i).addClass("iconWrong");
                    }
                }
            }
        } else if (t == "fitb") {
            $(".answerBox").css("opacity", 0);
            $(".answerBox").css("pointer-events", "none");
            $(".fillInPanel").css("opacity", 1);
            $(".fillInPanel").css("pointer-events", "auto");
            $("#fillInAnswer").css("opacity", 1);
            $("#fillInAnswer").css("pointer-events", "auto");
            $("#fillInAnswer").removeClass("anim_quickFadeOut");
            // Divide words into lines with line breaks
            var words = questions.questions[n].answerText[0].split(" ");
            var lines = [""];
            currentLine = 0;
            for (var i = 0; i < words.length; i++) {
                // Check if new word causes overflow
                if (lines[currentLine].length + words[i].length + 1 > 20) {
                    currentLine++;
                    lines[currentLine] = "";
                }
                // Add new word, adding a space if a word already exists in this line
                if (lines[currentLine] == "") {
                    lines[currentLine] += words[i];
                } else {
                    lines[currentLine] += " " + words[i];
                }
            }
            letterPanels = [];
            // Position panels
            for (var i = 0; i < 5; i++) {
                var rows = lines.length;
                if (i < rows) {
                    var cols = lines[i].length;
                    for (var j = 0; j < 20; j++) {
                        var panel = $("#fillInPanel" + (20 * i + j));
                        var panelText = $("#fillInPanelText" + (20 * i + j));
                        if (j < cols && lines[i].charAt(j) != " ") {
                            var letter = lines[i].charAt(j).toUpperCase();
                            letterPanels.push({
                                "pos": 20 * i + j,
                                "letter": letter
                            });
                            panelText.text("?");
                            panelText.css("color", "#808080");
                            panel.css({
                                'left': (5 * j + 2.5 * (20 - cols)) + "%",
                                'top': (20 * i) + "%"
                            });
                        } else {
                            panel.css("opacity", 0);
                        }
                    }
                } else {
                    for (var j = 0; j < 20; j++) {
                        var panel = $("#fillInPanel" + (20 * i + j));
                        var panelText = $("#fillInPanelText" + (20 * i + j));
                        panel.css("opacity", 0);
                    }
                }
            }
            $("#fillInAnswer").focus();
            letterFlipInterval = setInterval(function () {
                revealRandomLetter();
            }, 2000);
        } else if (t == "sr") {
            $(".answerBox").css("opacity", 0);
            $(".answerBox").css("pointer-events", "none");
            $(".fillInPanel").css("opacity", 0);
            $(".fillInPanel").css("pointer-events", "none");
            $("#fillInAnswer").css("opacity", 1);
            $("#fillInAnswer").css("pointer-events", "auto");
            $("#fillInAnswer").removeClass("anim_quickFadeOut");
            $("#questionText").addClass("srFix");
        }
    }
}

function submitTextAnswer(answer) {	// Called by 1 function: loadButtons()
    var qtype = questions.questions[currentQuestion].type;
    if (qtype == "fitb") {
        submitFillAnswer(answer);
    } else {
        submitShortResponse(answer);
    }
}

function submitFillAnswer(answer) {	// Called by 1 function: submitTextAnswer()
    clearInterval(letterFlipInterval);
    var isCorrect = false;
    userData.answerData[currentQuestion].answers.push(0);
    if (answer.toLowerCase() == questions.questions[currentQuestion].answerText[0].toLowerCase()) {
        // Correct
        answerCorrect(0);
        isCorrect = true;
    } else {
        // Incorrect
        answerIncorrect(0);
    }
    // Hide text input
    $("#fillInAnswer").addClass("anim_quickFadeOut");
    // Show expository text
    if (questions.questions[currentQuestion].expoText === undefined) {
        $("#expoText").text(isCorrect ? "Good job!" : "Not quite...");
    } else {
        if (questions.questions[currentQuestion].expoText[0] == "") {
            $("#expoText").text(isCorrect ? "Good job!" : "Not quite...");
        } else {
            $("#expoText").text(questions.questions[currentQuestion].expoText[0]);
        }
    }
    $("#expoBox").addClass("anim_expoFadeIn");
    saveLocalData();
}

function submitShortResponse(answer) {	// Called by 1 function: submitTextAnswer()
    userData.answerData[currentQuestion].answers.push(0);
    userData.responses[currentQuestion] = answer;
    answerCorrect(0);
    isCorrect = true;
    // Hide text input
    $("#fillInAnswer").addClass("anim_quickFadeOut");
    // Show expository text
    $("#expoText").text("Your answer has been recorded.");
    $("#expoBox").addClass("anim_expoFadeIn");
    saveLocalData();
}

function revealRandomLetter() {	// Called by 1 function: setQuestion()
    if (letterPanels.length > 0) {
        var r = Math.floor(letterPanels.length * Math.random());
        revealLetter(r);
    }
}

function revealAllLetters() {	// Called by 1 function: answerCorrect()
    var l = letterPanels.length;
    for (var i = 0; i < l; i++) {
        revealLetter(0);	//	Should this be (i)? Is this a typo? -Tony
    }
}

function revealLetter(r) {	// Called by 2 functions: revealRandomLetter() & revealAllLetters()
    l = letterPanels[r];
    $("#fillInPanel" + l.pos).addClass("anim_letterPanelSpin");
    $("#fillInPanelText" + l.pos).text(l.letter);
    $("#fillInPanelText" + l.pos).css("color", "#ffffff");
    letterPanels.splice(r, 1);
}

function showQuestionPanel() {	// Called by 1 function: setQuestion()
    $(".answerBox div").css({ "pointer-events": "all" });
    $('#quizBank').show();	//	Tony
    disableClicks = false;
    showingQuestion = true;
    //$("#questionBox").show(500);
    $("#questionBox").removeClass("anim_questionBoxHide");
    $("#questionBox").addClass("anim_questionBoxShow");
    $("#videoBox").removeClass("anim_unblurVideo");
    $("#videoBox").addClass("anim_blurVideo");
}

function hideQuestionPanel() {	// Called by 5 functions: questionReview(), questionContinue(), playVideo(), vidSeek() & hideQuestions()
    $(".answerBox div").css({ "pointer-events": "none" });
    $('#quizBank').hide();	//	Tony
    maximizeQuestionPanel();
    disableClicks = true;
    showingQuestion = false;
    //    $("#questionBox").hide();

    $("#questionBox").removeClass("anim_questionBoxShow");
    $("#questionBox").addClass("anim_questionBoxHide");
    $("#fillInAnswer").val("");
    clearInterval(letterFlipInterval);
    $(".anim_letterPanelSpin").removeClass("anim_letterPanelSpin");
    setTimeout(function () {
        disableClicks = false;
    }, 250);
    $("#videoBox").removeClass("anim_blurVideo");
    $("#videoBox").addClass("anim_unblurVideo");
}

function minimizeQuestionPanel() {	// Called by 1 function: loadButtons()
    $("#questionBoxContents").removeClass("anim_maximizeQuestionBox");
    $("#questionBoxContents").addClass("anim_minimizeQuestionBox");
    $("#videoBox").removeClass("anim_blurVideo");
    $("#videoBox").addClass("anim_unblurVideo");
    $("#smallQuestionBox").removeClass("anim_hideSmallQuestionBox");
    $("#smallQuestionBox").addClass("anim_showSmallQuestionBox");
}

function maximizeQuestionPanel() {	// Called by 2 functions: loadButtons() & hideQuestionPanel()
    $("#questionBoxContents").removeClass("anim_minimizeQuestionBox");
    $("#questionBoxContents").addClass("anim_maximizeQuestionBox");
    $("#videoBox").removeClass("anim_unblurVideo");
    $("#videoBox").addClass("anim_blurVideo");
    $("#smallQuestionBox").removeClass("anim_showSmallQuestionBox");
    $("#smallQuestionBox").addClass("anim_hideSmallQuestionBox");
}

function makeQuestionButtons() {	// Called by 1 function: loadButtons()
    var qCount = questions.questions.length;

    for (var i = 0; i < qCount; i++) {
        var q = questions.questions[i];
        var questionAnswerData = [];
        for (var j = 0; j < 6; j++) {
            if (q.answerText[j] != "") {
                questionAnswerData.push(false);

            }
        }

        answerData.push(questionAnswerData);

        // Question button
        $("#buttonBank").append("<div id='questionButton" + i + "' class='questionButton'></div>");
        $("#questionButton" + i).append("<div id='questionButtonText" + i + "' class='questionButtonText text fs-30'>" + (i + 1) + "</div>");
        $("#questionButton" + i).append("<div id='questionButtonIcon" + i + "' class='questionButtonIcon'></div>");
        $("#questionButton" + i).css("left", (50.9375 - 2.5 * qCount + 5 * i) + "%");
        initQuestionClickEvent(i);
        // Question marker on the timeline
        $("#questionMarkers").append("<div id='questionMarker" + i + "' class='questionMarker'></div>")
        $("#questionMarker" + i).append("<div id='questionMarkerText" + i + "' class='questionMarkerText text fs-18'>" + (i + 1) + "</div>");
    }
    resizeWindow();
}

function initQuestionClickEvent(i) {	// Called by 1 function: makeQuestionButtons()
    $("#questionButton" + i).click(function () {
        if (!userData.answerData[i].correct && !disableClicks) {
            setQuestion(i);
            recordTimeWatched();
            video.currentTime = questions.questions[i].startTime;
            watchStart = Math.round(video.currentTime);
            pauseVideo();
        }
    });
}

function playPause() {	// Called by 2 functions: loadButtons() & hideQuestions()
    if (video.paused) {
        video.currentTime = Math.max(0, video.currentTime - .5);
        playVideo();

    } else {
        if (Date.now() - lastTime > 700)		//	Tony
            pauseVideo();
    }
    lastTime = Date.now();					//	Tony
}

function playVideo() {	// Called by 3 functions: questionReview(), questionContinue() & playPause()
    if (video) video.play();
    $("#bigPlay").removeClass("playState");				//	Tony
    $("#videoPlayPause").removeClass("playState");
    //$("#videoPlayPause").addClass("pauseState");		//	Tony
    if (showingQuestion) {
        hideQuestionPanel();
    }
}

function pauseVideo() {	// Called by 4 functions: setQuestion(), initQuestionClickEvent(), playPause() & videoEnded()
    video.pause();
    $("#bigPlay").addClass("playState");				//	Tony
    //$("#videoPlayPause").removeClass("pauseState");	//	Tony
    $("#videoPlayPause").addClass("playState");
    // Record end time
    recordTimeWatched();
}

function vidSeek() {	// Called by 1 function: loadButtons()
    // Record time watched first
    var seekto = video.duration * ($("#seekSlider").val() / 100);
    if (answeredBeforeSeek(seekto)) {
        recordTimeWatched();
        video.currentTime = seekto;
        watchStart = Math.round(video.currentTime);
        if (showingQuestion) {
            hideQuestionPanel();
        }
        currentQuestion = -1;
    }
}

function answeredBeforeSeek(seekto) {
    for (i in questions.questions) {
        //console.log(userData.answerData)//,seekto,watchData.answerData[i].correct

        if (questions.questions[i].startTime < seekto && !userData.answerData[i].correct) {
            return false;
        }

    }

    return true;


}


function getWatchPercentage() {	// Called by 1 function: recordTimeWatched()
    var total = 0;
    //*pstdenis changed to handle watchData longer than duration
    //for (var i = 0; i < userData.watchData.length; i++) {
    for (var i = 0; i < userData.watchData.length; i++) {
        if (userData.watchData[i] > 0) {
            total++;
        }
    }
    var percentage = Math.floor(100 * total / userData.watchData.length);
    if (percentage >= 99) percentage = 100;
    return percentage;
}

function jumpToUnwatched() {
    var unwatchedStart = userData.watchData.indexOf(0);
    if (!(unwatchedStart == -1)) {
        console.log(unwatchedStart)
        video.currentTime = unwatchedStart;
        seekTimeUpdate()

    }


}




function recordTimeWatched() {	// Called by 5 functions: initQuestionClickEvent() pauseVideo() vidSeek() seekTimeUpdate() & videoEnded()
    //*pstdenis added duration check to try to avoid appended nulls
    var now = Math.min(Math.floor(video.duration), Math.floor(video.currentTime));
    var changed = false;
    for (var i = watchStart; i < now; i++) {
        if (!userData.watchData[i]) {
            userData.watchData[i] = 0;
        }
        userData.watchData[i]++;
        changed = true;
    }
    watchStart = now;
    if (changed) {
        updateScore();
    }


    // Update watch percentage
    var hasQuestionText = "";
    var watchPct = getWatchPercentage();
    if (watchPct >= 80) {

        $("#noQuestionText").addClass("anim_turnGreen");
    }
    if (questions.questions.length == 0) {
        hasQuestionText = "This quiz has no questions. "
        if (watchPct >= 80) {
            // Complete
            if (!recordedCompletion) {
                recordedCompletion = true;
                completeQuiz();
            }
        }
    }
    var newHTML = hasQuestionText + "You've watched " + watchPct + "% of the video." + (watchPct >= 80 ? "" : "");
    var prevHTML = $("#noQuestionText").html();
    if (newHTML !== prevHTML) {
        $("#noQuestionText").html(hasQuestionText + "You've watched " + watchPct + "% of the video." + (watchPct >= 80 ? "" : ""));
    }
}

function seekTimeUpdate() {	// Called by 1 function: loadButtons()
    var currentTime = video.currentTime;
    var currentPct = currentTime * (100 / video.duration);
    if (!video.paused) {
        $("#bigPlay").removeClass("playState");
        $("#videoPlayPause").removeClass("playState");
    }
    $("#seekSlider").val(currentPct);
    $("#seekSliderThumb").css("left", (currentPct - 1) + "%");
    $("#input[type=range]#seekSlider::-webkit-slider-thumb").css("left", (currentPct - 1) + "%");
    $("#timeDisplayText").text(formatTime(currentTime));
    // Check for question display
    for (var i = 0; i < questions.questions.length; i++) {
        if (currentTime > questions.questions[i].startTime && currentTime - questions.questions[i].startTime < 1 && currentQuestion < i) {	//	Tony replace '!=i' with '<i'
            setQuestion(i);
        }
    }

    // Record
    recordTimeWatched();
    // Save?
    var currentDate = new Date().getTime();
    userData.lastAccessDate = new Date();
    if (currentDate - lastSaved > 5000) {
        var currentDataCheck = JSON.stringify({ "watch": userData.watchData, "quiz": userData.answerData })
        if (currentDataCheck != idleCheck) {
            idleCheck = currentDataCheck;

            saveWatchData();
        }
        lastSaved = currentDate;

    }
}

function videoEnded() {	// Called by 1 function: loadButtons()
    pauseVideo();
    userData.watchData[userData.watchData.length - 1]++;
    recordTimeWatched();
    saveWatchData();
}

function videoMute() {	// Called by 1 function: loadButtons()
    video.muted = !video.muted;;
    $("#muteButton").toggleClass("muteOn");

}

function setInitialVolume() {
    var volume = localStorage.getItem('volume');
    if (volume) {
        $("#volumeSlider").val(volume * 100)
        setVolume()
    }

}

function setVolume() {	// Called by 1 function: loadButtons()

    video.volume = $("#volumeSlider").val() / 100;
    $("#volumeSliderThumb").css("left", ($("#volumeSlider").val() * .855) + "%");
    localStorage.setItem('volume', video.volume)
}

function formatTime(n) {	// Called by 1 function: seekTimeUpdate()
    var m = Math.floor(n);
    var hr = Math.floor(m / 3600);
    m -= 3600 * hr;
    var min = Math.floor(m / 60);
    m -= 60 * min;
    var sec = m;
    return (hr > 0 ? hr + ":" : "") + (min < 10 && hr != 0 ? "0" + min : min) + ":" + (sec < 10 ? "0" + sec : sec);
}

function saveWatchData() {	// Called by 3 functions: selectAnswer(), seekTimeUpdate() & videoEnded()

    if (userData) {


        saveLocalData();
        if (typeof ses !== 'undefined' && userData.bestScore) {
            ses.grade = (userData.bestScore) / 2000;
            postLTI(ses, userData.netID).then((result) => {
                var text = `Score:${userData.bestScore}<br>User:${userData.netID}`;
                if (!result.match(/success/g)) {
                    text = `<div style="color:red">Error submitting to Grade!</div>`;
                    setTimeout(() => {
                        location.reload
                        window.parent.location.reload()
                    }, 2000);

                }
                $('#bblink').html(text);
            });
        }
        for (i = 0; i < userData.watchData.length; i++) {
            if (!userData.watchData[i]) {
                userData.watchData[i] = 0;
            }
        }
        var str = JSON.stringify(userData);
        return saveData(str);
    }
}

function saveUserData() {	// Called by 2 functions: completeQuiz() & saveData()
    if (userData.attempts.length == 0) {
        var wrongAnswers = [];
        for (var i = 0; i < userData.answerData.length; i++) {
            var q = userData.answerData[i].answers;
            wrongAnswers.push(q.length - 1);
        }
        userData.attempts.push(wrongAnswers);
    }
    var str = JSON.stringify(userData);
    saveData(str);
}

function getGrade() {	//	Tony		// Called by 1 function: saveData()
    var ans = userData.answerData
    var total = ans.length;
    //var right = ans.filter(x=>x.correct).length; // breaks mobile Safari !
    var right = ans.filter(function (x) { return x.correct }).length;
    return right / total;
}

function saveData(str) {// Called by 2 functions: saveWatchData() & saveUserData()
    if (Date.now() - lastWatched > 300000) //5 minutes
    {
        location.reload();
    }
    else {
        lastWatched = new Date().getTime();
    }
    return $.ajax({
        type: "POST",
        url: "saveUserData.php",
        data: {
            'userData': str
        },
        success: function (data) {
            console.log({ data });
            if (data.includes("error_")) {
                location.reload();
            }
        },
        error: function () {
            location.reload();
        }
    });
}
function inframe() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}
function showQuestions() {	// Called by 1 function: loadButtons()
    showingQuestions = true;
    $("#toggleQuestionButton").removeClass("anim_toggleQuestionsOff");
    $("#toggleQuestionButton").addClass("anim_toggleQuestionsOn");
    $("#questionMarkers").removeClass("anim_hideQuestionMarkers");
    $("#questionMarkers").addClass("anim_showQuestionMarkers");
    $("#buttonBank").removeClass("anim_hideQuestionMarkers");
    $("#buttonBank").addClass("anim_showQuestionMarkers");
}

function hideQuestions() {	// Called by 1 function: loadButtons()
    showingQuestions = false;
    $("#toggleQuestionButton").removeClass("anim_toggleQuestionsOn");
    $("#toggleQuestionButton").addClass("anim_toggleQuestionsOff");
    $("#questionMarkers").removeClass("anim_showQuestionMarkers");
    $("#questionMarkers").addClass("anim_hideQuestionMarkers");
    $("#buttonBank").removeClass("anim_showQuestionMarkers");
    $("#buttonBank").addClass("anim_hideQuestionMarkers");
    if (showingQuestion) {
        hideQuestionPanel();
        if (video.paused) {
            playPause();
        }
    }
}

function loadLocalData() {	// Called by 1 function: loadButtons()
    //     var url = window.location.href;
    //     var data = JSON.parse(localStorage.getItem(url));
    //     console.log(data);
    //     if (data != null) {
    //         if (data.dataVersion == 1) {
    //             userData = data;
    //         }
    //     }
}

function saveLocalData() {	// Called by 4 functions: completeQuiz(), submitFillAnswer(), submitShortResponse() & saveWatchData()
    var status = "incomplete"
    if (userData.completeDate) {
        status = "done"
    }
    console.log(canAccessParent())
    if (canAccessParent() && window.parent.updateCompletion && !isNaN(userData.bestScore)) {
        window.parent.updateCompletion(urlVars["key"], userData.bestScore, status);
    }
}

function canAccessParent() {
    try {
        return Boolean(window.parent.location.href);
    }
    catch (e) {
        return false;
    }
}

function clearLocalData() {	// Called by 0 functions: previously called by loadButtons()
    //     var url = window.location.href;
    //     var newArray = [];
    //     for (var i = 0; i < questions.questions.length; i++) {
    //         newArray.push(false);
    //     }
    //     localStorage.setItem(url, JSON.stringify(newArray));
}

function updateScore() {	// Called by 5 functions: getUserData() loadUserData() loadButtons() answerCorrect() & recordTimeWatched()


    video = $("#videoBox")[0];
    var score = 0;
    // Compute score
    // Time watched
    var watchedSeconds = 0;
    var floorDuration = Math.floor(video.duration);
    //*pstdenis changed to avoid watchedData.length > video.duration
    //for (var i = 0; i < userData.watchData.length; i++) {
    //async fix
    if (video) {
        for (var i = 0; i < floorDuration; i++) {
            if (userData.watchData[i] > 0) {
                watchedSeconds++;
            }
        }
        score += Math.round(watchedSeconds / floorDuration * 1000);
        // Questions answered
        if (questions !== undefined) {
            if (questions.questions.length > 0) {
                var questionScore = 0;
                for (var i = 0; i < userData.answerData.length; i++) {
                    questionScore += userData.answerData[i].score;
                }
                let quizScore = Math.round(questionScore / questions.questions.length * 1000);
                score += quizScore;
                userData.quizScore = quizScore / 10;
            } else {
                score *= 2;
            }
        }
        var maxScore = 2000;
        var stars = [.5, .65, .8];
        for (var i = 0; i < stars.length; i++) {
            if (score >= stars[i] * maxScore) {
                $("#medal" + i).removeClass("medalGray").addClass("medalGold");
            } else {
                $("#medal" + i).removeClass("medalGold").addClass("medalGray");
            }
            $("#medal" + i).css("left", ((stars[i] * 100) - 2.5) + "%");
        }


        if (score >= userData.bestScore || !userData.bestScore) {
            userData.bestScore = score;
        }
        if (isNaN(score)) {
            score = 0;
        }
        userScore = Math.min(maxScore, score);
        $("#scoreNum").text(score);
        $("#scoreBar").css("width", (score / maxScore * 100) + "%");
    }
}