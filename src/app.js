var size;
var level = [
  [1, 1, 1, 1, 1, 1, 1],
  [1, 1, 0, 0, 0, 0, 1],
  [1, 1, 3, 0, 2, 0, 1],
  [1, 0, 0, 4, 0, 0, 1],
  [1, 0, 3, 1, 2, 0, 1],
  [1, 0, 0, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1]
];
var init_map = [            // 初期化用のマップ配列
  [1, 1, 1, 1, 1, 1, 1],
  [1, 1, 0, 0, 0, 0, 1],
  [1, 1, 3, 0, 2, 0, 1],
  [1, 0, 0, 4, 0, 0, 1],
  [1, 0, 3, 1, 2, 0, 1],
  [1, 0, 0, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1]
];
var stage = 1;
var ClearCount = 2;

var back_map = [];          // 戻り処理用のマップ配列
var back_crate = [];        // 初期化用の木箱スプライト配列
var back_crates = [];       // 戻り処理用の木箱スプライト配列
var init_crates = [];
var playerPosition; //マップ内のプレイやの位置(ｘ、ｙ)を保持する
var playerSprite; //プレイヤーのスプライト
var cratesArray = []; //配置した木箱のスプライトを配列に保持する
var crateFallCount = 0; //木箱が穴に落ちた場合のカウント数を保持
var startTouch;
var endTouch;
var swipeTolerance = 10;//スワイプかを判断する閾値

var gameScene = cc.Scene.extend({
  onEnter: function() {
    this._super();

    var layer0 = new gameLayer();
    layer0.init();
    this.addChild(layer0);

    //音楽再生エンジン
    audioEngine = cc.audioEngine;
    //bgm再生
    if (!audioEngine.isMusicPlaying()) {
      audioEngine.playMusic(res.bgm_main, true);
    }
  }
});

var gameLayer = cc.Layer.extend({
  init: function() {
    this._super();
    //スプライトフレームのキャッシュオブジェクトを作成する
    cache = cc.spriteFrameCache;
    //スプライトフレームのデータを読み込む
    cache.addSpriteFrames(res.spritesheet_plist);
    var backgroundSprite = cc.Sprite.create(cache.getSpriteFrame("background.png"));
    //アンチエイリアス処理を止める
    backgroundSprite.getTexture().setAliasTexParameters();

    backgroundSprite.setPosition(240, 160);
    //スプライトがとても小さいので拡大する
    backgroundSprite.setScale(5);
    this.addChild(backgroundSprite);

    for (i = 0; i < 7; i++) {
      for (j = 0; j < 7; j++) {
        switch (level[i][j]) {
          case 0:
          case 3:
          case 4:
          fieldSprite = cc.Sprite.create(cache.getSpriteFrame("field.png"));
          fieldSprite.setPosition(165 + 25 * j, 185 - 25 * i);
          fieldSprite.setScale(5);
          this.addChild(fieldSprite);
          break;
          case 1:
          wallSprite = cc.Sprite.create(cache.getSpriteFrame("wall.png"));
          wallSprite.setPosition(165 + 25 * j, 185 - 25 * i);
          wallSprite.setScale(5);
          this.addChild(wallSprite);
          break;
          case 2:
          holeSprite = cc.Sprite.create(cache.getSpriteFrame("hole.png"));
          holeSprite.setPosition(165 + 25 * j, 185 - 25 * i);
          holeSprite.setScale(5);
          this.addChild(holeSprite);
          break;
        }
      }
    }
    for (i = 0; i < 7; i++) {　　　　　　
      cratesArray[i] = [];　 //配列オブジェクトの生成
      init_crates[i] = [];
      for (j = 0; j < 7; j++) {
        switch (level[i][j]) {
          case 4:
          case 6:
            playerSprite = cc.Sprite.create(cache.getSpriteFrame("player.png"));
            playerSprite.setPosition(165 + 25 * j, 185 - 25 * i);
            playerSprite.setScale(5);
            this.addChild(playerSprite);
            playerPosition = {
              x: j,
              y: i
            };　　　　　　　　　　　　
            cratesArray[i][j] = null;　 //playerがいるので、その場所には木箱はないのでnullを代入する
            var copy = cratesArray[i][j];
            init_crates[i][j] = copy;
            break;
          case 3:
          case 5:
            var crateSprite = cc.Sprite.create(cache.getSpriteFrame("crate.png"));
            crateSprite.setPosition(165 + 25 * j, 185 - 25 * i);
            crateSprite.setScale(5);
            this.addChild(crateSprite);
            cratesArray[i][j] = crateSprite;//(i,j)の位置にcrateSpriteを入れる
            var copy = cratesArray[i][j];
            init_crates[i][j] = copy;
            break;
          default:
            cratesArray[i][j] = null;//木箱のコード以外の場合は、その場所に木箱がない値としてnullを代入する
            var copy = cratesArray[i][j];
            init_crates[i][j] = copy;
            break;
        }
      }
    }
    //return true;
    cc.eventManager.addListener(listener, this);
    cc.eventManager.addListener({
      event: cc.EventListener.KEYBOARD,
      onKeyPressed: function(keyCode, event){
        if(keyCode == 82) reset();          // R-Keyでリセット
        if(keyCode == 66) back();           // B-Keyでバック
      }
    }, this);
  },
});
var listener = cc.EventListener.create({
event: cc.EventListener.TOUCH_ONE_BY_ONE,
swallowTouches: true,
onTouchBegan:function (touch,event) {
startTouch = touch.getLocation();
return true;
},
onTouchEnded:function(touch, event){
endTouch = touch.getLocation();
swipeDirection();
}
});
//スワイプ方向を検出する処理
function swipeDirection(){


    var distX = endTouch.x - startTouch.x ;
    var distY = endTouch.y - startTouch.y ;
    if(Math.abs(distX)+Math.abs(distY)>swipeTolerance){
        if(Math.abs(distX)>Math.abs(distY)){
            if(distX>0){//右方向移動
              //playerSprite.setPosition(playerSprite.getPosition().x+25,playerSprite.getPosition().y);
                move(1,0);
            }
            else{//左方向移動
              //playerSprite.setPosition(playerSprite.getPosition().x-25,playerSprite.getPosition().y);
                move(-1,0);
            }
        }
        else{
        //  console.log("endTouch.y "+endTouch.y );
        //  console.log("startTouch.y "+startTouch.y );
        //  console.log("distY "+ distY );
            if(distY>0){ //上方向移動
            //  playerSprite.setPosition(playerSprite.getPosition().x,playerSprite.getPosition().y+25);
               console.log("上 move(0,-1) distY "+ distY );
              move(0,-1);

            }
            else{ //下方向移動
              //playerSprite.setPosition(playerSprite.getPosition().x,playerSprite.getPosition().y-25);
              console.log("下 move(0,1) distY "+ distY );
              move(0,1);
            }
        }
    }
}
function move(deltaX,deltaY){
  back_up();  //バックアップ
  switch(level[playerPosition.y+deltaY][playerPosition.x+deltaX]){
    case 0:
    case 2:
        level[playerPosition.y][playerPosition.x]-=4;
        playerPosition.x+=deltaX;
        playerPosition.y+=deltaY;
        level[playerPosition.y][playerPosition.x]+=4;
        playerSprite.setPosition(165+25*playerPosition.x,185-25*playerPosition.y);
    break;
    case 3:
    case 5:
        if(level[playerPosition.y+deltaY*2][playerPosition.x+deltaX*2]==0 ||
           level[playerPosition.y+deltaY*2][playerPosition.x+deltaX*2]==2){
            level[playerPosition.y][playerPosition.x]-=4;
            playerPosition.x+=deltaX;
            playerPosition.y+=deltaY;
            level[playerPosition.y][playerPosition.x]+=1; //木箱の位置にプレイヤー
            playerSprite.setPosition(165+25*playerPosition.x,185-25*playerPosition.y);
            level[playerPosition.y+deltaY][playerPosition.x+deltaX]+=3;//木箱(3)の移動先

            var movingCrate = cratesArray[playerPosition.y][playerPosition.x];
            movingCrate.setPosition(movingCrate.getPosition().x+25*deltaX,movingCrate.
            getPosition().y-25*deltaY);
            cratesArray[playerPosition.y+deltaY][playerPosition.x+deltaX]=movingCrate;
            cratesArray[playerPosition.y][playerPosition.x]=null;
        }
        break;
    }
    complete_check()      //クリアの確認
}
// リセット処理
function reset(){
  crateFallCount = 0;
  for (var i = 0; i < 7; i++){
    for (var j = 0; j < 7; j++){
      var copy = init_map[i][j];
      level[i][j] = copy;
      switch (level[i][j]) {
        case 4:
        case 6:
          playerSprite.setPosition(165 + 25 * j, 185 - 25 * i);
          playerPosition = {
            x: j,
            y: i
          };
          var copy = init_crates[i][j];
          cratesArray[i][j] = copy;
          break;
        case 3:
        case 5:
          var copy = init_crates[i][j];
          cratesArray[i][j] = copy;
          var crateSprite = cratesArray[i][j];
          crateSprite.setPosition(165 + 25 * j, 185 - 25 * i);
          break;
        default:
          var copy = init_crates[i][j];
          cratesArray[i][j] = copy;
          break;
      }
    }
  }
}
//ひとつ前のバックアップ処理
function back_up(){
  for (var i = 0; i < 7; i++){
    back_map[i] = [];
    back_crates[i] = [];
    for (var j = 0; j < 7; j++){
      var copy1 = level[i][j];
      back_map[i][j] = copy1;
      var copy2 = cratesArray[i][j];
      back_crates[i][j] = copy2;
    }
  }
}
//一つ前に戻る処理
function back(){
  for(var i = 0; i < 7; i++){
    for(var j = 0; j < 7; j++){
      var copy1 = back_map[i][j];
      level[i][j] = copy1;
      switch (level[i][j]) {
        case 4:
        case 6:
          playerSprite.setPosition(165 + 25 * j, 185 - 25 * i);
          playerPosition = {
            x: j,
            y: i
          };
          var copy2 = back_crates[i][j];
          cratesArray[i][j] = copy2;
          break;
        case 3:
        case 5:
          var copy2 = back_crates[i][j];
          cratesArray[i][j] = copy2;
          var crateSprite = cratesArray[i][j];
          crateSprite.setPosition(165 + 25 * j, 185 - 25 * i);
          break;
        default:
          var copy2 = back_crates[i][j];
          cratesArray[i][j] = copy2;
          break;
      }
    }
  }
}
// クリアチェック処理
function complete_check(){
  var gameClearflg = 0; //箱を落とした数判定
  for (var i = 0; i < 7; i++) {
    for (var j = 0; j < 7; j++) {
      if ( level[i][j] == 5 ) gameClearflg +=1;//箱を落としたので変数に加算
    }
  }
  console.log(gameClearflg);
  if (gameClearflg == ClearCount){
      stage = stage + 1; //次のステージへ行くための変数
    if (audioEngine.isMusicPlaying()) {
      audioEngine.stopMusic();//音楽の再生をストップ
    }
    cc.director.runScene(new gameover());//リザルトに移動
    if(stage == 4){
      stage = 1;
    }
  }
}
