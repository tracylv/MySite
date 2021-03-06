var Admins = function () {

    geddy.viewHelpers.page_info.page_title = "TracyLv - 管理员";
    geddy.viewHelpers.menu_data.active_tab = "admin";

    this.respondsWith = ['html', 'json', 'xml', 'js', 'txt'];

    this.before(geddy.viewHelpers.requireAuth(null), { only: ['login', 'login_post'] });
    this.before(geddy.viewHelpers.requireAuth(geddy.model.Admin.userrole.junior), { only: ['category'] });
    this.before(geddy.viewHelpers.requireAuth(geddy.model.Admin.userrole.senior), { only: ['list', 'show', 'signup', 'signup_post', 'edit', 'update', 'remove'] });


    this.login = function (req, resp, params) {

        // set auto login default value
        params.autologin = true;

        if(req.headers.referer && !geddy.string.include(req.headers.referer, "signup") && !geddy.string.include(req.headers.referer, "login")){
            params.redirecturl = req.headers.referer;
        }

        this.respond({admin: params});
    };

    this.login_post = function (req, resp, params) {
        var self = this;

        geddy.model.Admin.first({username: params.username, password: params.password}, function(err, admin) {
            if (err) {
                throw err;
            }
            if (admin) {

                // set auto login
                if(!!params.autologin == true)
                {
                    self.cookies.set("userid", admin.id, { expires : geddy.date.add(new Date(), "day", 7)});
                    self.cookies.set("usertype", geddy.viewHelpers.user_type.admin, { expires : geddy.date.add(new Date(), "day", 7)});
                }
                else
                {
                    self.cookies.set("userid", admin.id, { expires : geddy.date.add(new Date(), "day", -1)});
                    self.cookies.set("usertype", geddy.viewHelpers.user_type.admin, { expires : geddy.date.add(new Date(), "day", -1)});
                }

                // set session
                self.session.set("userid", admin.id);
                self.session.set("username", admin.nickname);

                if(admin.istop == true)
                {
                    self.session.set("userrole", geddy.model.Admin.userrole.super);
                }
                else if(admin.issuper == true)
                {
                    self.session.set("userrole", geddy.model.Admin.userrole.senior);
                }
                else
                {
                    self.session.set("userrole", geddy.model.Admin.userrole.junior);
                }

                // redirect after successful login
                if(params.redirecturl)
                {
                    self.redirect(params.redirecturl);
                }
                else
                {
                    self.redirect("/admins/category");
                }

            }
            else {
                params.loginError = geddy.model.Admin.loginError;
                self.respond({admin: params}, {format: 'html', template: 'app/views/admins/login'});
            }
        });
    };

    this.category = function (req, resp, params) {
        this.respond({});
    };

    this.list = function (req, resp, params) {
        var self = this;
        var issuper = false;
        if(params.issuper == "true")
        {
            issuper = true;
        }

        if(issuper == true && self.session.get("userrole") != geddy.model.Admin.userrole.super)
        {
            throw new geddy.errors.UnauthorizedError();
        }
        else
        {
            geddy.model.Admin.all({ "issuper": issuper, not: {istop: true}},function(err, admins){
                if(err){
                    throw err;
                }
                self.respondWith(admins, {type: "Admin"});
            });
        }
    };

    this.show = function (req, resp, params) {
        var self = this;
        var userrole = self.session.get("userrole");

        geddy.model.Admin.first(params.id, function(err, admin) {
            if (err) {
                throw err;
            }
            if (!admin) {
                throw new geddy.errors.NotFoundError();
            }
            else {
                if((userrole == geddy.model.Admin.userrole.senior && (admin.issuper == true || admin.istop == true)) || (userrole == geddy.model.Admin.userrole.super && admin.istop == true))
                {
                    throw new geddy.errors.UnauthorizedError();
                }
                else
                {
                    self.respondWith(admin);
                }
            }
        });
    };

    this.signup = function (req, resp, params) {
        this.respond({admin: params});
    };

    this.signup_post = function (req, resp, params) {
        var self = this;
        var admin = geddy.model.Admin.create(params);
        var duplicate = false;
        var userrole = self.session.get("userrole");

        // check if user have already existed
        geddy.model.Admin.first({ username : admin.username}, function(err, curradmin) {
            if (err) {
                throw err;
            }
            if (curradmin) {
                admin.dupicateerror = geddy.model.Admin.duplicateUsernameError;
                duplicate = true;
            }
        });

        // check if the email had been used.
        geddy.model.Admin.first({ email : admin.email }, function(err, curradmin) {
            if (err) {
                throw err;
            }
            if (curradmin) {
                admin.duplicateEmail = geddy.model.Admin.duplicateEmailError;
                duplicate = true;
            }
        });

        if(!params.issuper)
        {
            admin.updateProperties({issuper: false});
        }
        else
        {
            admin.updateProperties({issuper: true});
        }

        if (!admin.isValid() || duplicate == true) {
            this.respond({admin: admin}, {format: 'html', template: 'app/views/admins/signup'});
        }
        else {
            if((userrole == geddy.model.Admin.userrole.senior && (admin.issuper == true || admin.istop == true)) || (userrole == geddy.model.Admin.userrole.super && admin.istop == true))
            {
                throw new geddy.errors.UnauthorizedError();
            }
            else
            {
                admin.save(function(err, data) {
                    if (err) {
                        throw err;
                    }

                    var redirecturl = "/admins/list";
                    if(self.session.get("userrole") == geddy.model.Admin.userrole.super){
                        redirecturl = "/admins/category";
                    }

                    self.redirect(redirecturl);
                });
            }
        }
    };

    this.edit = function (req, resp, params) {
        var self = this;
        var userrole = self.session.get("userrole");

        geddy.model.Admin.first(params.id, function(err, admin) {
            if (err) {
                throw err;
            }
            if (!admin) {
                throw new geddy.errors.BadRequestError();
            }
            else {
                if((userrole == geddy.model.Admin.userrole.senior && (admin.issuper == true || admin.istop == true)) || (userrole == geddy.model.Admin.userrole.super && admin.istop == true))
                {
                    throw new geddy.errors.UnauthorizedError();
                }
                else
                {
                    self.respondWith(admin);
                }
            }
        });
    };

    this.update = function (req, resp, params) {
        var self = this;
        var duplicate = false;
        var userrole = self.session.get("userrole");

        geddy.model.Admin.first(params.id, function(err, admin) {
            if (err) {
                throw err;
            }

            if(!params.issuper)
            {
                admin.updateProperties({issuper: false});
            }
            else
            {
                admin.updateProperties({issuper: true});
            }

            // check if user have already existed
            if(admin.username != params.username) {
                geddy.model.Admin.first({ username : params.username}, function(err, curradmin) {
                    if (err) {
                        throw err;
                    }
                    if (curradmin) {
                        admin.dupicateerror = geddy.model.Admin.duplicateUsernameError;
                        duplicate = true;
                    }
                });
            }

            if(admin.email != params.email) {
                geddy.model.Admin.first({ email : params.email}, function(err, curradmin) {
                    if (err) {
                        throw err;
                    }
                    if (curradmin) {
                        admin.duplicateEmail = geddy.model.Admin.duplicateEmailError;
                        duplicate = true;
                    }
                });
            }

            admin.updateProperties(params);

            if (!admin.isValid() || duplicate == true) {
                self.respond({admin: admin}, {format: 'html', template: 'app/views/admins/edit'});
            }
            else {
                if((userrole == geddy.model.Admin.userrole.senior && (admin.issuper == true || admin.istop == true)) || (userrole == geddy.model.Admin.userrole.super && admin.istop == true))
                {
                    throw new geddy.errors.UnauthorizedError();
                }
                else
                {
                    admin.save(function(err, data) {
                        if (err) {
                            throw err;
                        }
                        self.respond({admin: admin}, {format: 'html', template: 'app/views/admins/show'});
                    });
                }
            }
        });
    };

    this.remove = function (req, resp, params) {
        var self = this;
        var userrole = self.session.get("userrole");

        geddy.model.Admin.first(params.id, function(err, admin) {
            if (err) {
                throw err;
            }
            if (!admin) {
                throw new geddy.errors.BadRequestError();
            }
            else {

                if((userrole == geddy.model.Admin.userrole.senior && (admin.issuper == true || admin.istop == true)) || (userrole == geddy.model.Admin.userrole.super && admin.istop == true))
                {
                    throw new geddy.errors.UnauthorizedError();
                }
                else
                {
                    geddy.model.Admin.remove(params.id, function(err) {
                        if (err) {
                            throw err;
                        }

                        var redirecturl = "/admins/list";
                        if(self.session.get("userrole") == geddy.model.Admin.userrole.super){
                            redirecturl = "/admins/category";
                        }
                        self.redirect(redirecturl);
                    });
                }
            }
        });
    };

};

exports.Admins = Admins;