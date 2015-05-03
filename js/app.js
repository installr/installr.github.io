var server = "http://installr.herokuapp.com/"
// var server = "http://freeslugs.ngrok.com/"

var app = angular.module('app', ["checklist-model"]);

app.controller('MainCtrl', function ($scope, grabCasks){


  grabCasks.get(function(data) {
    $scope.apps = data;
  });

  $scope.user = {
    apps: []
  };
  $scope.checkAll = function() {
    $scope.user.apps = angular.copy($scope.apps);
  };
  $scope.uncheckAll = function() {
    $scope.user.apps = [];
  };
  $scope.checkFirst = function() {
    $scope.user.apps.splice(0, $scope.user.apps.length); 
    $scope.user.apps.push('guest');
  };
  $scope.install = true;
  $scope.genScript = function() {
    var i = $scope.install == true ? "i" : "u";
    var apps = $scope.user.apps.map(function(app) { return app.caskName }).join("%");
    var url = "curl -o installr http://installr.io/installr && curl -o .installr.local " + server + i + "/" + apps + " && sh installr 2>&1 | tee ~/installr.log"
    return url;
  };
});

app.filter('customFilter', function() {

  var search = function search(apps, scope) {
    var q = scope.query;
    if(!q) 
      return apps;
    var queryString = q.replace(/[^A-Za-z0-9]/g, ""),
      regexp = new RegExp(queryString, "i");

    var results = apps.filter(function(el) { return regexp.test(el.entryName) })
    return results;
  }

  return search;
});

app.factory('grabCasks', function ($http) {

    var factory = {};

    factory.get = function (cb) {
      var retrieveCaskData = function retrieveCaskData(cb, err) {
        request(commitTreeURL)
          .success(function (commits) {
            request(latestTreeURL(commits))
              .success(function (tree) { cb(tree) })
              .error(function (jqXHR, _, errorThrown) { err(jqXHR, errorThrown) })})
          .error(function (jqXHR, _, errorThrown) { err(jqXHR, errorThrown) });
      }

      var caskList;

      var loadCasks = function loadCasks(data) {
        caskList = indexCaskData(data)
        cb(caskList);
      }

      retrieveCaskData(loadCasks);
    }

    var commitTreeURL = "https://api.github.com/repos/caskroom/homebrew-cask/commits?per_page=1";
    var isCaskFile = function isCaskfile(el) { return /^Casks\/.+\.rb/.test(el.path) };

    var indexCaskData = function indexCaskData(data) {
      var toEntry = function(el, i) {
        var caskFileName = /^Casks\/(.+).rb/.exec(el.path)[1];
        return { id: i,
                 caskName: caskFileName,
                 appName: caskFileName,
                 entryName: caskFileName.replace(/[^A-Za-z0-9]/g, ""),
                 caskUrl: el.url }
      };

      var casks = data.tree.filter(isCaskFile).map(toEntry);
      return casks;
    }

    var request = function request(url) { 
        return $http.get(url)
    };

    var latestTreeURL = function latestTreeURL(data) {
      return "https://api.github.com/repos/caskroom/homebrew-cask/git/trees/"
              + data[0].sha
              + "?recursive=1";
    }

    return factory;    
});