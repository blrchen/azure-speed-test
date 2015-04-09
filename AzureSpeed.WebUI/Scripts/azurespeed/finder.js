$(function () {
    var finder = {
        input: $('#lookup-input'),
        button: $('button[data-action="lookup"]'),
        init: function () {
            finder.button.click(function () {
                var value = $('#lookup-input')[0].value;
                var output = $('#lookup-output');
                output.text('Searching please wait ...');
                $.ajax({
                    type: 'get',
                    url: "/api/getregion",
                    data: { ipOrUrl: value },
                    success: function (data) {
                        output.text(data);
                    },
                    error: function (data) {
                        output.text(data.message);
                    },
                });
            });
            finder.input.keypress(function (e) {
                if (e.which == 13) {
                    finder.button.trigger('click');
                }
            });
        }
    };
    window.finder = finder;
    finder.init();
});