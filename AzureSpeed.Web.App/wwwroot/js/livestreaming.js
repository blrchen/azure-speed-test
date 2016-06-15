$(function () {
    var ls = {
        initPlayer: function () {
            amp.options.flashSS.swf = 'http://amp.azure.net/libs/amp/1.0.0/techs/StrobeMediaPlayback.2.0.swf';
            amp.options.flashSS.plugin = 'http://amp.azure.net/libs/amp/1.0.0/techs/MSAdaptiveStreamingPlugin-osmf2.0.swf';
            amp.options.silverlightSS.xap = 'http://amp.azure.net/libs/amp/1.0.0/techs/SmoothStreamingPlayer.xap';

            var myOptions = {
                autoplay: true,
                nativeControlsForTouch: false,
                loop: false,
                heuristicProfile: 'High Quality',
                customPlayerSettings: {
                    customHeuristicSettings: {
                        preRollInSec: 4,
                        windowSizeHeuristics: true
                    }
                }
            };
            myOptions.techOrder = ['flashSS', 'flash'];
            var url = $('#streaming-url').text();
            var mimeType = 'application/vnd.ms-sstr+xml';
            var mySourceList = [{ src: url.trim(), type: mimeType, disableUrlRewriter: true }];
            var myTrackList = [];

            var myPlayer = amp('azuremediaplayer', myOptions);
            myPlayer.autoplay(true);
            myPlayer.src(mySourceList, myTrackList);
        },
        updateClock: function () {
            var now = new Date(),
            time = now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
            $('#time').text(time);
            setTimeout(ls.updateClock, 1000);
        }
    };
    ls.initPlayer();
    ls.updateClock();
});


