const webpack = require('webpack');
const ChildProcess = require('child_process');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const PurifyCSSPlugin = require('purifycss-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const WebpackDevServer = require("webpack-dev-server");
const WebpackBrowserPlugin = require('webpack-browser-plugin');
const npmConfig = require('../package.json');

// GLOBAL constants
const RELEASE = process.argv.includes('--release');
const DEBUG = process.argv.includes('--debug');
const PORT = process.env.PORT = 3000;
const DEV_PORT = 8080;
const SERVER_ENTRY_PATH = path.join(__dirname, '..', 'src', 'server');
const SERVER_ENTRY_FILE = path.join(__dirname, '..', 'src', 'server', 'index.js');
const SERVER_OUTPUT_DIR = path.join(__dirname, '..', 'build');
const CLIENT_ENTRY_DIR = path.join(__dirname, '..', 'src', 'client');
const CLIENT_ENTRY_FILE = path.join(__dirname, '..', 'src', 'client', 'app.js');
const CLIENT_OUTPUT_DIR = path.join(__dirname, '..', 'build', 'public');

let clientConfig, serverConfig, server;

// ----------------------------------------------
// Webpack
// ----------------------------------------------

// Common Webpack Configurations
const serverCommonConfig = {
	entry: SERVER_ENTRY_FILE,
	target: 'node',
	output: {
		path: SERVER_OUTPUT_DIR,
		filename: 'index.js',
    libraryTarget: 'commonjs'
	},
	module: {
		loaders: [
			{
				test: /\.js$/,
				exclude: '/node_modules/',
				loader: 'babel',
        query: {
          presets: ['es2015']
        }
			}
		]
	},
  // Don't resolve dependecies for node
	externals: Object.keys(Object.assign({}, npmConfig.devDependencies, npmConfig.dependencies))
}

const clientCommonConfig = {
	entry: {
		app: CLIENT_ENTRY_FILE
	},
	output: {
		path: CLIENT_OUTPUT_DIR,
		filename: '[name].[hash].js',
		chunkFilename: '[chunkhash].js',
    publicPath: '/'
	},
	module: {
    loaders: [
      {
  			test: /\.scss$/,
  			loader: ExtractTextPlugin.extract('style', 'css', 'sass'),
  			include: CLIENT_ENTRY_DIR
  		},{
        test: /\.json$/,
        loader: 'json-loader',
      },{
        test: /\.txt$/,
        loader: 'raw-loader',
      },{
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/,
        loader: 'url-loader?limit=10000',
      },{
        test: /\.(eot|ttf|wav|mp3)$/,
        loader: 'file-loader',
      }
    ]
	}
}

// Build webpack config depending on the environment
if (RELEASE) {

  // Build webpack configuration for production environment
  clientConfig = Object.assign({}, clientCommonConfig, {
    module: {
      loaders: [
        ...clientConfig.module.loaders,
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exlude: /node_modules/,
          query: {
            presets: ['react', 'es2015']
          }
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        title: 'Webpack Demo',
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          preserveLineBreaks: false
        }
      }),
      new PurifyCSSPlugin({
        basePath: process.cwd(),
        // `paths` is used to point PurifyCSS to files not
        // visible to Webpack. You can pass glob patterns
        // to it.
        paths: [CLIENT_ENTRY_DIR]
      }),
      // The DefinePlugin replaces occurrences of the given identifiers
      // with the given expressions. After that, UglifyJS detects dead code
      // blocks and removes them
      new webpack.DefinePlugin({'process.env.NODE_ENV': '"production"'}),

      // Minimize js files
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false
        }
      }),
      // Output extracted CSS to a file
      new ExtractTextPlugin('[name].[chunkhash].css'),
      new webpack.optimize.CommonsChunkPlugin({
        names: ['vendor', 'manifest']
      })
    ]
  });

  serverConfig = Object.assign({}, serverCommonConfig, {
    plugins: [
      // The DefinePlugin replaces occurrences of the given identifiers
      // with the given expressions. After that, UglifyJS detects dead code
      // blocks and removes them
      new webpack.DefinePlugin({'process.env.NODE_ENV': '"production"'}),
      // Minimize js files
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false
        }
      })
    ]
  });

} else {

  // Build webpack configuration for development environment
  clientConfig = Object.assign({}, clientCommonConfig, {
    devtool: 'source-map',
    entry: [
      clientCommonConfig.entry.app,
      'webpack-dev-server/client?http://localhost:' + DEV_PORT,
      'webpack/hot/dev-server'

    ],
    module: {
      loaders: [
        ...clientCommonConfig.module.loaders,
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exlude: /node_modules/,
          query: {
            presets: ['react', 'es2015', 'react-hmre']
          }
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        title: 'Webpack Demo'
      }),
      new ExtractTextPlugin('[name].[chunkhash].css'),
      new CleanWebpackPlugin(CLIENT_OUTPUT_DIR, {
        root: process.cwd()
      }),
      new webpack.DefinePlugin({ 'process.env.BROWSER': false }),
      // Enable multi-pass compilation for enhanced performance
      // in larger projects. Good default.
      new webpack.HotModuleReplacementPlugin({
        // multiStep: true
      }),
      new webpack.NoErrorsPlugin(),
      new WebpackBrowserPlugin({
        port: DEV_PORT,
        url: 'http://localhost'
      })
    ]
  });

  serverConfig = Object.assign({}, serverCommonConfig, {
    devtool: 'source-map',
    node: {
      console: false,
      global: false,
      process: false,
      Buffer: false,
      __filename: false,
      __dirname: false
    },
    plugins: [
      new CleanWebpackPlugin(path.join(SERVER_OUTPUT_DIR, '*'), {
        root: process.cwd(),
        exclude: [CLIENT_OUTPUT_DIR]
      }),
      new webpack.BannerPlugin('require("source-map-support").install();', { raw: true, entryOnly: false })
    ]
  })

}

// ---------------------------------------
// Utility Functions
// ---------------------------------------
function clearOldBuild() {
  // Deletes everything inside of ./build directory but keeps
  // the dot files untouched (e.g. .git)
  del.sync('./build/*');
}

function bundle(config) {
  // clearOldBuild();
  return new Promise((resolve, reject) => {
    webpack(config).run((err, stats) => {
      if(err) console.log(err);
      console.log(stats.toString());
      return resolve();
    });
  });
}

function runServer() {
  let params = [];
  if (DEBUG) {
    params.push('--debug-brk');
    params.push('--inspect=9222');
  }
  params.push(path.join(SERVER_OUTPUT_DIR, 'index.js'));
  if(server) server.kill();
  server = ChildProcess.spawn('node', params, {
    env: process.env
  });

  server.stdout.on('data', data => console.log(`Express Server: ${data}`));
  server.stderr.on('data', data => console.log(`Express Server: ${data}`));

  process.on('exit', () => {
    if (server) server.kill();
  });
}

function serve() {
  function handleBundleComplete() {
    runServer();
    const compiler = webpack(clientConfig);
    let devServer = new WebpackDevServer(compiler, {
      hot: true,
      inline: true,
      open: true,
      historyApiFallback: true,
      quiet: false,
      stats: {
        colors: true
      },
      proxy: {
        '**' : {
          target: 'http://localhost:' + PORT,
          bypass: function(req, res, proxyOptions) {
            console.log(req.path)
            if (req.path === '/__webpack_hmr') {
              return true;
            }
          }
        }
      }
    });
    devServer.listen(DEV_PORT);

    handleBundleComplete = runServer;
  }

  webpack(serverConfig).watch({}, (err, stats) => {
    console.log(stats.toString({ colors: true }));
    handleBundleComplete();
  });
}

// -------------------------------------
// Tasks
// -------------------------------------
switch (process.env.npm_lifecycle_event) {
  case 'build':
    bundle();
    break;
  case 'serve':
    serve();
    break;
  default:
    break;
}
