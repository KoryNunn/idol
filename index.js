var fs = require('fs'),
    path = require('path'),
    svgToPng = require('svgtopng'),
    kgo = require('kgo');

function watchBuffer(filePath, cacheFilePath, cacheObj) {
    if(cacheFilePath in cacheObj) {
        return;
    }

    cacheObj[cacheFilePath] = null;

    fs.watchFile(filePath, function() {
        delete cacheObj[cacheFilePath];
    });
}

function scale(min, max, scalar, value){
    return Math.ceil(Math.max(min, Math.min(
        min * Math.pow(
            scalar, 
            Math.ceil(
                Math.log(value / min) / Math.log(scalar)
            )
        ),
        max
    )));
}

function getSize(sizeOptions, width, height){
    if(!width || !height){
        return;
    }
    if(sizeOptions){
        sizeOptions.min || (sizeOptions.min = 5);
        sizeOptions.max || (sizeOptions.max = 10000);
        sizeOptions.scalar || (sizeOptions.scalar = 1.1);

        width = scale(sizeOptions.min, sizeOptions.max, sizeOptions.scalar, parseInt(width));
        height = scale(sizeOptions.min, sizeOptions.max, sizeOptions.scalar, parseInt(height));
    }
    return [width, height];
}

function initIdol(imagesDirectory, cacheDirectory, sizeOptions, maxAge){
    if(typeof sizeOptions !== 'object'){
        maxAge = sizeOptions;
        sizeOptions = null;
    }

    maxAge || (maxAge = 0);

    cacheDirectory = path.resolve(imagesDirectory, cacheDirectory);

    var pngs = {};

    return function(requestedImagePath, options, callback){
        if(typeof options === 'function'){
            callback = options;
            options = {};
        }

        var size = getSize(sizeOptions, options.width, options.height),
            imagePath = path.join(imagesDirectory, requestedImagePath),
            pngName = path.basename(requestedImagePath, '.svg'),
            cacheFolderPath = path.join(cacheDirectory, path.dirname(requestedImagePath), size ? size.join('x') : ''),
            cacheFilePath = path.join(cacheFolderPath, pngName + '.png'),
            conversionOptions = {
                width: size && size[0],
                height: size && size[1]
            };
        
        kgo
        ('pngCreated', function(done){
            if(cacheFilePath in pngs){
                return callback(null, cacheFilePath)
            }

            kgo
            ('exists', function(done){
                fs.exists(cacheFilePath, done.bind(null, null));
            })
            (['exists'], function(exists){
                if(exists){
                    console.log('from cache');
                    return done();
                }

                svgToPng(imagePath, cacheFilePath, conversionOptions, done);
            })
            .on('error', function(error){
                done(error);
            })
        })
        (['!pngCreated'], function(){
            watchBuffer(imagePath, cacheFilePath, pngs);
            callback(null, cacheFilePath);
        })
        .on('error', function(error){
            callback(error);
        });
    }
}

module.exports = initIdol;