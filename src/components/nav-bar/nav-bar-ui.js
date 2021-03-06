define(['text!./nav-bar.html','nav-bar', 'router', 'knockout', 'jquery', 'knockout-i18next', 'scorekeeper-api', 'knockout-i18next-translator'],
    function(template, navBar, router, ko, $, knockoutI18next, api, Translator) {
        'use strict';

        function NavBarViewModel() {
            var self = this;
            self.menus = navBar.menus;
            self.currentLanguage = ko.pureComputed(function() {
                return knockoutI18next.lng() === 'fr' ? 'Français' : 'English';
            });

            self.nextLanguage = ko.pureComputed(function() {
                return knockoutI18next.lng() === 'fr' ? 'English' : 'Français';
            });

            self.changeLanguageFR = function() {
                knockoutI18next.lng('fr');
            };

            self.translator = new Translator();
            self.t = self.translator.t;

            self.username = api.user ? api.user.profile.name.givenName : null;

            self.logout = function() {
                api.logout();
            }

            self.changeLanguageEN = function() {
                knockoutI18next.lng('en');
            };

            self.toggleLanguage = function() {
                knockoutI18next.lng(knockoutI18next.lng() === 'fr' ? 'en' : 'fr');
            };

            $(document).on('click','.navbar-collapse.in',function(e) {
                if( $(e.target).is('a') && ( $(e.target).attr('class') != 'dropdown-toggle' ) ) {
                    $(this).collapse('hide');
                }
            });
        }

        NavBarViewModel.prototype.isPageActive = function(menu) {
            var currentRoute= router.currentRoute();

            if(currentRoute){
                return menu.url.toLowerCase() === currentRoute.url.toLowerCase();
            }

            return false;
        };

        return {
            viewModel: NavBarViewModel,
            template: template
        };
    });
