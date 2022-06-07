To get the environment working, run
    > npm install
in the project's root directory.
To compile the source code into minified JavaScript, run
    > npx webpack
For security reasons, the browser will not allow the application to run from a null origin. Therefore, you will need to use a local HTTP server. (I use 200 OK: Web Server for Chrome.) In addition, WebXR features refuse to run on an insecure connection unless the hostname is localhost. Note that 127.0.0.1 will not work; it must be localhost.