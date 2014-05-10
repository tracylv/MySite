var Games = function () {

    geddy.viewHelpers.page_info.page_title = "我的网站 - 游戏";
    geddy.viewHelpers.menu_data.active_tab = "game";

    this.respondsWith = ['html', 'json', 'xml', 'js', 'txt'];

    this.before(geddy.viewHelpers.requireAuth, { only: ['index'] });

    this.index = function (req, resp, params) {
        this.respond({params: params});
    };
};



exports.Games = Games;