var app = angular.module('app', []);

app.factory('posts', ['$http', function($http) {
	var url = "data.json"
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


app.controller('PostController', ['$scope', 'posts', function($scope, posts) {
	posts.success(function(data) {
		$scope.moods = ["Angry", "Chill", "Uplifting", "Third-Type"]
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


