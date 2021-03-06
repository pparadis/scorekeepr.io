define(['text!./game-page.html', 'knockout', 'lodash', 'knockout-i18next-translator'],
    function(template, ko, _, Translator) {
        'use strict';

        var Player = function(name, score) {
            var self = this;

            this.name = ko.observable(name);
            this.score = ko.observable(score || 0);
            this._score = 0;
            this.isWinning = ko.observable(false);
            this.isLosing = ko.observable(false);

            this.add = function() {
                self.score(self.score() + 1);
            };

            this.remove = function() {
                self.score(self.score() - 1);
            };
        };

        var ViewModel = function(context, componentInfo) {
            var self = this;

            self.players = ko.observableArray([]);

            self.translator = new Translator();
            self.t = self.translator.t;

            self.socket = context.socket;
            self.connected = ko.observable(self.socket.connected);

            self.game = context.game;
            self.viewerCount = ko.observable(self.game.viewers.length);

            self.name = ko.observable(self.game.name).extend({
                required: true
            });

            self.description = ko.observable(self.game.description);

            self.gameFields = ko.validatedObservable({
                name: self.name,
                description: self.description
            }).extend({
                bootstrapValidation: {}
            });

            self.reset = reset;

            self.addPlayer = function() {
                addPlayer(self);
            };

            _.forEach(self.game.players, function(plyr) {
                addPlayer(self, plyr.name, plyr.score, true);
            });

            self.socket.on('user-joined', function(data) {
                self.viewerCount(data.viewers.length);
            });

            self.socket.on('user-left', function(data) {
                self.viewerCount(data.viewers.length);
            });

            self.socket.on('end-of-game', function(data) {
                console.log(data.reason);
            });

            self.socket.on('disconnect', function() {
                self.connected(false);
            });

            self.socket.on('connect', function() {
                self.connected(true);
            });

            self.players.subscribe(function(players) {
                updateServerGameData(self.socket, self.players);
            });
        };

        ViewModel.prototype.save = function() {
            var self = this;
            self.gameFields.isValidAsync().then(function(valid) {
                if (valid) {
                    $.ajax({
                        url: '/api/games/' + self.game.slug,
                        type: 'PUT',
                        dataType: 'json',
                        data: {
                            name: self.name(),
                            description: self.description()
                        },
                        success: function(data) {
                            $('#edit').collapse('toggle');
                        }
                    });
                }
            });
        };

        ViewModel.prototype.dispose = function() {
            var self = this;

            self.translator.dispose();
        };

        function addPlayer(self, name, score, preventServerUpdate) {
            var playerNumber = self.players().length + 1;
            var name = name || (self.t('general.player')() + playerNumber);
            var score = score || 0;

            var player = new Player(name, score);
            self.players.push(player);

            player.name.subscribe(function() {
                updateServerGameData(self.socket, self.players);
            });

            player.score.subscribe(function(value) {
                player._score = value;
                _.forEach(self.players(), function(plyr) {
                    plyr.isWinning(false);
                    plyr.isLosing(false);
                });

                var max = _.max(self.players(), function(plyr) {
                    return plyr.score();
                }).score();
                var min = _.min(self.players(), function(plyr) {
                    return plyr.score();
                }).score();

                updateServerGameData(self.socket, self.players);

                if (max == min) {
                    return;
                }

                _.where(self.players(), {
                    '_score': max
                }).forEach(function(plyr) {
                    plyr.isWinning(true);
                });
                _.where(self.players(), {
                    '_score': min
                }).forEach(function(plyr) {
                    plyr.isLosing(true);
                });
            });
        };

        function reset(self) {
            var self = this;
            self.players([]);

            // _.forEach(self.players(), function(plyr) {
            //     plyr.score(0);
            // });
        };

        function updateServerGameData(socket, players) {
            var jsPlayers = ko.mapping.toJS(players);

            socket.emit('game-data', _.map(jsPlayers, function(plyr) {
                return {
                    name: plyr.name,
                    score: plyr.score
                };
            }));
        }

        return {
            viewModel: {
                createViewModel: function(context, componentInfo) {
                    return new ViewModel(context, componentInfo);
                }
            },
            template: template
        };
    });
