var Sites = function () {

    geddy.viewHelpers.page_info.page_title = "TracyLv - 网站定制";
    geddy.viewHelpers.menu_data.active_tab = "site";

    this.respondsWith = ['html', 'json', 'xml', 'js', 'txt'];

    this.before(geddy.viewHelpers.requireAuth(null), { only: ['index'] });

    this.index = function (req, resp, params) {
        this.respond({params: params});
    };
};



exports.Sites = Sites;