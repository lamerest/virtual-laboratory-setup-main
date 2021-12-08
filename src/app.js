import * as THREE from 'three';
import * as Stats from "stats.js";
import Setup from "./Setup";
import Scene from "./Scene";

//ВИДЖЕТ FPS
const STATS = new Stats();
STATS.showPanel(0);
document.body.appendChild(STATS.dom);

//СОЗДАНИЕ СЦЕНЫ
const SCENE = new Scene((scene)=>{
    scene.addLight(true);
    scene.setBackground('build/res/textures/laboratory.png');
});

//ЗАГРУЖАЕМ УСТАНОВКУ
const SETUP = new Setup(SCENE.scene)

//ИЗМЕРЕНИЕ
let measureStarted = false;
const measureTime = new THREE.Clock(false);

let timeStopped;
//РАСЧЁТ ТЕКУЩЕЙ ПОЗИЦИИ И УГЛА ПОВОРОТА ДИСКА
function measure(){
    if(measureStarted){
        let halfT = SETUP.physicalQuantities.halfT;
        let A = SETUP.physicalQuantities.A;
        let a = SETUP.physicalQuantities.a;
        let startAngle = SETUP.physicalQuantities.startAngle;
        let e = SETUP.physicalQuantities.e;
        let time = SETUP.physicalQuantities.time;
        let t = measureTime.getElapsedTime();
        let tT = (t / halfT | 0) % 2 ? halfT - (t - halfT * (t / halfT | 0)) : t - halfT * (t / halfT | 0);

        //КОЭФФИЦИЕНТ ЗАТУХАНИЯ
        let k = t - halfT > 0 ? Math.cos((t - halfT)/50) : 1;
        //---------------------
        //ПОЗИЦИЯ ДИСКА
        SETUP.disk.position.y = 15 + (A*100 - (a * tT**2 / 2 * 100)) * k;

        let rotationDirection;
        switch ((t / halfT | 0) % 4) {
            case 0:
            case 3:
                rotationDirection = true;
                break;
            case 1:
            case 2:
                rotationDirection = false;
                break;
        }
        SETUP.disk.rotation.z = (rotationDirection ? startAngle + e * tT**2 / 2 : startAngle - e * tT**2 / 2) * k;
        //ОБНОВЛЕНИЕ НИТЕЙ
        SETUP.renderThreads();
        //---------------
        //ВЫВОД ВРЕМЕНИ НА ЭКРАН
        if(!timeStopped) {
            if(t < time) {
                SETUP.SCREEN.setNumber(t);
            }else{
                SETUP.SCREEN.setNumber(time);
                timeStopped = true;
            }
        }
    }
}

let stopper;
//НАЧАЛО ЭКСПЕРИМЕНТА
function measureStart(){
    //ИЗМЕНЕНИЕ СОСТОЯНИЙ КНОПОК
    document.getElementById("changeRing").disabled = true;
    document.getElementById("sensorMoveUp").disabled = true;
    document.getElementById("sensorMoveDown").disabled = true;
    document.getElementById("measureControl").onclick = measureStop;
    document.getElementById("measureControl").textContent = "Закончить измерение";
    //РАСЧЁТ ФИЗИЧЕСКИХ ВЕЛИЧИН МАЯТНИКА (момент инерции и вес)
    SETUP.calculatePhysicalQuantities();
    //---------------------------------------------------------
    timeStopped = false;
    measureStarted = true;
    //ЗАПУСК СЕКУНДОМЕРА
    measureTime.start();
    //ОСТАНОВКА МАЯТНИКА ПОСЛЕ 3.5 ПЕРИОДОВ
    stopper = setTimeout(()=>{measureStop();}, SETUP.physicalQuantities.halfT*7000);
}

//НАЗНАЧЕНИЕ ФУНКЦИИ НАЧАЛА ЭКСПЕРИМЕНТА НА КНОПКУ
document.getElementById("measureControl").onclick = measureStart;

//ОСТАНОВКА МАЯТНИКА И ВОЗВРАЩЕНИЕ К ИСХОДНОМУ СОСТОЯНИЮ
function measureStop(){
    clearTimeout(stopper);
    measureTime.stop();
    measureStarted = false;
    SETUP.disk.position.y = SETUP.startPoint;
    SETUP.renderThreads();
    document.getElementById("changeRing").disabled = false;
    document.getElementById("sensorMoveUp").disabled = false;
    document.getElementById("sensorMoveDown").disabled = false;
    document.getElementById("measureControl").onclick = measureStart;
    document.getElementById("measureControl").textContent = "Начать измерение";
}

//ОТРИСОВКА СЦЕНЫ
function animate() {
    SCENE.resizeRenderer();
    requestAnimationFrame(animate);
    SCENE.controls.update();
    STATS.begin();
    measure();
    SCENE.renderer.render(SCENE.scene, SCENE.camera);
    STATS.end();
}
animate();