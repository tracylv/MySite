var Lives = function () {

    geddy.viewHelpers.page_info.page_title = "TracyLv - 首页";
    geddy.viewHelpers.menu_data.active_tab = "life";

    this.respondsWith = ['html', 'json', 'xml', 'js', 'txt'];

    this.before(geddy.viewHelpers.requireAuth(null), { only: ['index'] });

    this.index = function (req, resp, params) {
        this.respond({params: params});
    };
};



exports.Lives = Lives;