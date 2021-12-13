// Express 기본 모듈 사용하기
var express = require('express')
, http = require('http')
, path = require('path');
 
// Express의 미들웨어 불러오기
var bodyParser = require('body-parser')
, cookieParser = require('cookie-parser')
, static = require('serve-static')
, errorHandler = require('errorhandler');
 
// 오류 핸들러 모듈 사용
var expressErrorHandler = require('express-error-handler');

// Session 미들웨어 불러오기
var expressSession = require('express-session');

/* 설치한 socket.io 모듈 불러오기 */
//var socket = require('socket.io')
// 익스프레스 객체 생성
var app = express();

var fs = require('fs')
var ejs = require('ejs')
app.engine('ejs', require('ejs').__express)

var socketio = require('socket.io');
var fs = require('fs');
/* express http 서버 생성 */
//var server = http.createServer(app)
/* 생성된 서버를 socket.io에 바인딩 */

// 기본 속성 설정
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
// body-parser를 사용해 application/x-www-form-urlencoded 파싱
app.use(express.urlencoded({extended:false}));
 
// body-parser를 사용해 application/json 파싱
app.use(express.json());
app.use(express.static('src'));

// public 폴더를 static 으로 오픈
app.use('/public', static(path.join(__dirname, 'public')));
// css 폴더를 static 으로 오픈
app.use('/css', static(path.join(__dirname, 'css')));

 //게시판과 답글 스키마
var Board = require('./models/board');
var Comment = require('./models/comment');

app.use('/models', static(path.join(__dirname, 'models')));

// cookie-parser 설정
app.use(cookieParser());
 
// 세션 설정
app.use(expressSession({
    secret:'my key',
    resave:true,
    saveUninitialized:true
}));
// 라우터 객체 참조
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
const { MongoServerClosedError, LEGAL_TCP_SOCKET_OPTIONS } = require('mongodb');
 
// 데이터베이스 객체를 위한 변수 선언
var database;
//몽구스 모듈 불러들이기
var mongoose = require('mongoose');
const { userInfo } = require('os');

// 데이터베이스 스키마 객체를 위한 변수 선언
var UserSchema;
 
// 데이터베이스 모델 객체를 위한 변수 선언
var UserModel;


// 데이터베이스에 연결
function connectDB(){
    // 데이터베이스 연결 정보
    var databaseUrl = 'mongodb://localhost:27017/local';
    
    // 데이터베이스에 연결
    console.log('데이터베이스 연결을 시도합니다.');
    mongoose.Promise = global.Promise;
    mongoose.connect(databaseUrl);
    database = mongoose.connection;
    
    database.on('error', console.error.bind(console, 'mongoose connection error'));
    database.on('open', function(){
        console.log('데이터베이스에 연결되었습니다. : ' + databaseUrl);
        // 스키마 정의
        UserSchema = mongoose.Schema({
            id: String,
            password: String,
            name: String,
            email: String,
            nickname: String,
            cellphoneNo: String
        });
        console.log('UserSchema 정의함.');
        
        // UserModel 모델 정의
        UserModel = mongoose.model("users", UserSchema);
        console.log('UserModel 정의함.');
    });
    
    // 연결 끊어졌을 때 5초 후 재연결
    database.on('disconnected', function(){
        console.log('연결이 끊어졌습니다. 5초 후 다시 연결합니다.');
        setInterval(connectDB, 5000);
    });
}
// creates DB schema for MongoDB / requires 'username' & 'message'
var userSchema1 = mongoose.Schema({
    username: 'string',
    message: 'string'
});
 
// compiles our schema into a model
var Chat = mongoose.model('Chat', userSchema1);

//사용자를 추가하는 함수(id,password,name)
var addUser = function(database, id, password, passwordConfirm, name, email, nickname, cellphoneNo, res, callback) {
    console.log(`addUser 호출됨 : ${id}. ${password}, ${passwordConfirm}, ${name}, ${email}, ${nickname}, ${cellphoneNo}`);
    
    // id , password, username 을 사용해 사용자 추가
    var user = new UserModel({"id":id, "password":password, "name":name, "email":email, "nickname":nickname, "cellphoneNo":cellphoneNo});

    UserModel.find({"id":id}, function(err, results){        
        
        if(id == undefined || password == undefined || name == undefined){
            res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
            res.write("<script>alert('아이디와 비밀번호, 이름은 필수 입력 입니다.');location.href=document.referrer;</script>");
        } else if(password != passwordConfirm){
            res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
            res.write("<script>alert('비밀번호가 불일치 합니다.');location.href=document.referrer;</script>");
        } else {
            if(results.length > 0) {
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                res.write("<script>alert('중복된 아이디 입니다.');location.href=document.referrer;</script>");
            } else {
                //사용자 정보 저장
                user.save(function(err){
                    if(err) {
                        callback(err, null);
                        return;
                    }
                    console.log('사용자 데이터 추가함.')
                    callback(null,user)
                    
                })
            }
        }
    });
}
//db에 저장된 아이디 비밀번호와 일치 여부 함수
var authUser = function(database, id, password, callback){
    console.log('authUser 호출됨.');   
    
    // 아이디와 비밀번호를 사용해 검색
    UserModel.find({"id":id, "password":password}, function(err,results){
        if(err) {
            callback(err, null);
            return;
        }
        console.log('아이디 [%s], 비밀번호 [%s]로 사용자 검색 결과', id,password);
        console.dir(results);

        if(results.length > 0){
            console.log('아이디 [%s]. 비밀번호 [%s]가 일치하는 사용자 찾음,',id,password);
            callback(null,results);
        }else{
            console.log('일치하는 사용자를 찾지 못함.');
            callback(null,null);
        }
    });
}
// 로그인 라우터 함수 - 데이터베이스의 정보와 비교
router.route('/process/login').post(function(req,res){
    console.log('/process/login 호출됨.');
    
    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;
    var paramName = req.body.name || req.query.name;
    var paramEmail = req.body.email || req.query.email;
    var paramNickname = req.body.nickname || req.query.nickname;
    var paramCellphoneNo = req.body.cellphoneNo || req.query.cellphoneNo;
 
    if(database){
        authUser(database, paramId, paramPassword,function(err, docs){
            if(err) {throw err;}
            //로그인 성공시
            if(docs){
                console.dir(docs);
                //세션 저장
                req.session.user = {
                    id:paramId,
                    password:paramPassword,
                    name:paramName,
                    email:paramEmail,
                    nickname:paramNickname,
                    cellphoneNo:paramCellphoneNo,
                    authorized: true
                };
                var user = req.session.user;
                //res.redirect('/public/main.html')
                res.render("main", {user: user
                    
                });
            }else{
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                res.write("<script>alert('로그인실패');location.href=document.referrer;</script>");
                
            }
        });
    }else{
        res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
        res.write('<h2>데이터베이스 연결 실패</h2>');
        res.write('<div><p>데이터베이스에 연결하지 못했습니다.</p></div>');
        res.end();
    } 
});
router.post('/home', function(req, res, next) {
    if(req.session.user){
        var user = req.session.user;
        res.render('main',{user: user});
    }
});

router.post('/userInfo', function(req, res, next) {
    if(req.session.user){
        var user = req.session.user;
        res.render('userInfo',{user: user});
    }
});
// 로그아웃 라우팅 함수 - 로그아웃 후 세션 삭제함
router.route('/process/logout').get(function(req,res){
    console.log('/process/logout 호출됨.');
    
    if(req.session.user){
        //로그인된 상태
        console.log('로그아웃 합니다.');
        req.session = null;
        console.log('세션을 삭제하고 로그아웃되었습니다.');
        res.redirect('/public/login.html');
        
    } else {
        //로그인 안된 상태
        console.log('아직 로그인되지 않습니다.');
        res.redirect('/public/login.html');
    }
});
//사용자 추가 라우팅함수
router.route('/process/adduser').post(function(req, res) {
    console.log('/process/adduser 호출됨.');
    // 요청 파라미터 확인
    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;
    var paramPasswordConfirm = req.body.passwordConfirm || req.query.passwordConfirm;
    var paramName = req.body.name || req.query.name;
    var paramEmail = req.body.email || req.query.email;
    var paramNickname = req.body.nickname || req.query.nickname;
    var paramCellphoneNo = req.body.cellphoneNo || req.query.cellphoneNo;
    
        
    console.log(`요청 파라미터 : ${paramId}, ${paramPassword}, ${paramPasswordConfirm}, ${paramName}, ${paramEmail}, ${paramNickname}, ${paramCellphoneNo}`);
// 데이터베이스 객체가 초기화된 경우, addUser 함수 호출하여 사용자 인증
    if (database) {
        addUser(database, paramId, paramPassword, paramPasswordConfirm, paramName, paramEmail, paramNickname, paramCellphoneNo, res, function(err, addedUser) {
            if(err) {
                throw err;
            }
            // 결과 객체 확인하여 추가된 데이터 있으면 성공 응답 전송
            if(addedUser) {
                console.dir(addedUser);
                res.redirect('/public/signupConfirm.html')

            } else {
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                res.write("<script>alert('회원가입 실패');location.href=document.referrer;</script>");
            }
        });
    } else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
        res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
        res.write('<h2>데이터베이스 연결 실패</h2>');
        res.end();
    }
});


//======================================게시판 라우팅 함수들=======================
/* ejs에서 '/' post 되면, 즉 게시판 카테고리 클릭하면 posting.ejs(게시판 목록)로 이동 */
router.post('/', function(req, res, next) {   
    Board.find({}, function (err, board) {
        res.render('posting', {board: board});
    });
    
});
router.get('/posting', function(req, res, next) {   
    Board.find({}, function (err, board) {
        res.render('posting', {board: board});
    });
    
});
  /* 글쓰기 */
router.get('/write', function(req, res, next) {
    res.render('write', { title: '글쓰기'});
});
  
  /* 글 작성 완료!  */
router.post('/board/write', function (req, res) {
    var board = new Board();
    var user = req.session.user;
    board.title = req.body.title;
    board.contents = req.body.contents;
    board.shareG = req.body.shareG;
    board.salePrice = req.body.salePrice;
    board.airline = req.body.airline;
    board.flight = req.body.flight;
    board.id = user.id
    board.save(function (err) {
        if(err){
            console.log(err);
            res.redirect('/posting');
        } else {
            //router.get(/posting)으로 이동
            res.redirect('/posting');
        }
    });
});
  
  /* 게시글 제목 클릭했을 때 상세정보 띄움 */
router.get('/board/:id', function (req, res) {
    Board.findOne({_id: req.params.id}, function (err, board) {
        res.render('postInfo', { title: 'postInfo', board: board });
    })
});
  
  /* 댓글 남기기 */
router.post('/comment/write', function (req, res){
    var comment = new Comment();
    var user = req.session.user;
    comment.contents = req.body.contents;
    comment.author = user.id

    Board.findOneAndUpdate({_id : req.body.id}, { $push: { comments : comment}}, function (err, board) {
        if(err){
            console.log(err);
            res.redirect('/');
        }
        res.redirect('/board/'+req.body.id);
    });
});

/* GET users listing. */
//router.get('/', function(req, res, next) {
//    res.send('respond with a resource');
//});

module.exports = router;
/*=============================================================================================*/


/* ============================채팅 =========================Get 방식으로 / 경로에 접속하면 실행  */

// request from web browser
app.use('/c', function(req,res,next){
    if(req.url != '/favicon.ico'){
        fs.readFile(__dirname+'/chatroom.ejs', function(error, data){
            res.writeHead(200, {'Content-Type':'text/html'});
            res.write(data);
            res.end();
        });
    }
});

/* 채팅 함수들 ============================================================================================= */

// 라우터 객체 등록
app.use('/', router)

var errorHandler = expressErrorHandler({
    static:{
        '404':'./public/404.html'
    }
});
 
app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

var server = http.createServer(app);
// ===== 서버 시작 ===== //
server.listen(app.get('port'), function(){
    console.log('서버가 시작되었습니다. 포트 : ' + app.get('port'));
    connectDB();
});

var io = socketio.listen(server);
 
// executed on connection
io.sockets.on('connection', function(socket) {
 
    // receives message from DB
    Chat.find(function (err, result) {
        for(var i = 0 ; i < result.length ; i++) {
            var dbData = {name : result[i].username, message : result[i].message};
            io.sockets.sockets[socket.id].emit('preload', dbData);
        }
    });
 
    // sends message to other users + stores data(username + message) into DB
    socket.on('message', function(data) {
 
        io.sockets.emit('message', data);
        // add chat into the model
        var chat = new Chat({ username: data.name, message: data.message });
 
        chat.save(function (err, data) {
          if (err) {// TODO handle the error
              console.log("error");
          }
          console.log('message is inserted');
        });
 
    });
});
