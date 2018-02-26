var app = angular.module('app', []);


app.factory('posts', ['$http', function($http) {
	var url = "flags.json"
    return $http.get(url, {withCredentials: true })
        .success(function(data) {
            return data;
            console.log(data);
            
        })
        .error(function(err) {
            return err;
            console.log(err);
        });
}]);

app.controller('DateController', ['$scope', function($scope) {

	var firstRound = new Date(2017, 4, 7);
	var current = new Date();
	var datum = ((firstRound - current) / 1000 / 60 / 60 / 24) ;

	$scope.date = datum;
}]);

app.controller('PostController', ['$scope', 'posts', function($scope, posts) {
	posts.success(function(data) {
		$scope.themes = ["europe","france","entreprise","politique","favoriser","publique","développement","nation","travail","recherche","publics","euro","droit","mer","union","services","formation","territoire","logement","financements","handicap","enseignement","protection","justice","culture","innovation","investissement","apprentissage","environnement","aide","smic","autonomie","patrimoine"];
		$scope.posts = data;
		angular.forEach($scope.posts, function(post) {
			post.rank = Math.random();
		});
	});

	
}]);



app.filter('advanceFilter', ['$filter', function($filter){
	return function(data, text){
		if(text != undefined){
			var textArr = text.split(' ');
			angular.forEach(textArr, function(test){
				if(test){
					data = $filter('filter')(data, test);
				}
			})
			return data;
		}
		else{
			return data;
		}
	};

	
}]);


