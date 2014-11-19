# idol

auto svg to png converter with caching and stepped sizing.

## usage

    npm install idol


```javascript
var path = require('path'),
    publicPath = path.join(__dirname, '../../public'),
    imagesDirectory = path.join(publicPath, './images'),
    idol = require('idol')(
        imagesDirectory, 
        './generated',
        {
            min: 10, // Minimum size a png can be
            max: 2000, // Maximum size a png can be
            scalar: 1.5  // Scale of each step the sizes can be
        }
    );


    ... later ...

        GET: function(request, response){
            var size = get requested image size form querystring perhaps?,
                imagePath = get imagepath from request.url somehow.;

            idol(
                imagePath, 
                {
                    width: size.width,
                    height: size.height
                },
                function(error, pngFilePath){
                    if(error){
                        console.log(error);
                        return;
                    }

                    // redirect the request to the generated file.
                    response.writeHead(301, {
                      'Location': path.relative(imagesDirectory, pngFilePath)
                    });
                    response.end();
                }
            );
        }
    };


```