import * as THREE from "three";
import {OBJLoader} from "three/addons/loaders/OBJLoader.js"; // object loader
import {MTLLoader} from "three/addons/loaders/MTLLoader.js"; // Obj texture loader
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'; // camera controls

// Call main function when DOM content is loaded
document.addEventListener('DOMContentLoaded', main);

function main() {

    // canvas and renderer
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({antialias: true, canvas});

    // camera set up
    const fov = 45;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 200;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    // scene
    const scene = new THREE.Scene();

    // camera controls
    const control = new OrbitControls(camera, renderer.domElement);

    camera.position.set(-.1, 4, 15);
    control.target.set(-.1, 2.5, 0);
    control.update();

    // load in windmill
    const objLoader = new OBJLoader();
    const mtlLoader = new MTLLoader();
    const windmill_x =  3.5;
    const windmill_z = 0;
    mtlLoader.load('textures/windmill_001.mtl', (mtl) => {
        mtl.preload();
        mtl.materials.Material.side = THREE.DoubleSide;
        objLoader.setMaterials(mtl);
	    objLoader.load('textures/windmill_001.obj', ( root ) => {
            root.rotation.y = -Math.PI / 2;
            root.position.x = windmill_x;
            root.position.z = windmill_z;
		    scene.add( root );
	    } );
    } );

    // define box geometry
    const boxWidth = 2;
    const boxHeight = 2;
    const boxDepth = 2;
    const box_geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    // define cone geometry
    const coneRadius = 2;
    const coneHeight = 3;
    const cone_geometry = new THREE.ConeGeometry(coneRadius, coneHeight);

    // define cylinder geometry
    const cylinderRadTop = 2;
    const cylinderRadBot = 2;
    const cylinderHeight = 2;
    const cylinder_geometry = new THREE.CylinderGeometry(cylinderRadTop, cylinderRadBot, cylinderHeight);

    // define hemisphere geometry
    const radius = 3
    const hemisphereGeo = new THREE.SphereGeometry(radius, undefined, undefined, undefined, undefined, 0, Math.PI/2);

    // define sphere geometry
    const rad = 1;
    const sphereGeo = new THREE.SphereGeometry(rad);


    // texture loader
    const loader = new THREE.TextureLoader();
    const texture = loader.load("textures/highGrass.jpg");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    const repeats = 20 / 2;
    texture.repeat.set(repeats, repeats);


    // simple shape generator
    function makeInstance( geometry, color, pos ) {

		const material = new THREE.MeshPhongMaterial( { color } );

		const shape = new THREE.Mesh( geometry, material );
		scene.add( shape );

		shape.position.x = pos[0];
        shape.position.y = pos[1];
        shape.position.z = pos[2];

		return shape;

	}

    // sky box
    const skyBoxTex = loader.load(
        'sky3.jpg',
        (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            texture.colorSpace = THREE.SRGBColorSpace;
            scene.background = texture;
        }
    );

    // shapes to be rendered
    const shapes = []

    // textured floor
    const material = new THREE.MeshPhongMaterial( {
		map: texture
	} );
    const cube = new THREE.Mesh( box_geometry, material );
    cube.scale.x = 100;
    cube.scale.z = 100;
    cube.scale.y = .1
	scene.add( cube );
	shapes.push( cube ); // add to our list of cubes to rotate

    function randomInt(a, b) {
        return Math.floor(Math.random() * (b-a+1)) + a
    }

    // cloud
    function makeCloud() {

        function makeBump() {
            const cloudColor = 0xf6f6f6
            const spherePos = [0, 0, 0];
            const bump = makeInstance(hemisphereGeo, cloudColor, spherePos);
            return bump;
        }

        let cloud = []
        let height = randomInt(15, 20);
        let bumpNum = randomInt(2, 5);
        let x_pos =  randomInt(-60, 60);
        let z_pos = randomInt(-60, 60);
        for (let i = 0; i < bumpNum; i++) {
            let bump = makeBump();
            bump.position.y = height; 
            bump.scale.x = randomInt(7, 13) / 10;
            bump.scale.z = randomInt(8, 12) / 10;
            bump.scale.y = randomInt(5, 15) / 10;
            bump.position.x = randomInt(-20, 20) + .5;
            bump.position.z = randomInt(-20, 20);
            bump.position.x = x_pos + 2*i;
            bump.position.z = z_pos;

            let base = makeBump();
            base.position.y = height;
            base.scale.x = bump.scale.x;
            base.scale.z = bump.scale.z;
            base.scale.y = bump.scale.y;
            base.position.x = bump.position.x;
            base.position.z = bump.position.z;
            base.position.x = x_pos + 2*i;
            base.position.z = z_pos;
            base.scale.y = -.1;
            
            cloud.push(bump);
            cloud.push(base);
        }
        return cloud;
    }

    let leafTex = loader.load('textures/leaves.jpg');
    leafTex.wrapS = THREE.RepeatWrapping;
    leafTex.wrapT = THREE.RepeatWrapping;
    leafTex.magFilter = THREE.NearestFilter;
    leafTex.colorSpace = THREE.SRGBColorSpace;
    let lrepeats = 4 / 2;
    leafTex.repeat.set(lrepeats, repeats);

    

    // make tree
    function dist(x1, x2, z1, z2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(z1 - z2, 2));
    }

    function makeTree() {
        let trunk = makeInstance(cylinder_geometry, 0x25150B, [0,0,0])
        trunk.scale.set(.3, 2, .3);
        let x = randomInt(-70, 70);
        let z = randomInt(-70, 70);
        while (dist(x, windmill_x, z, windmill_z) < 15) {
            x = randomInt(-50, 50);
            z = randomInt(-50, 50);
        }
        trunk.position.set(x, 2, z);
        scene.add(trunk);

        let material = new THREE.MeshPhongMaterial( {
            map: leafTex
        } );
        let leaves = new THREE.Mesh(cone_geometry, material);

        leaves.scale.set(1, 2, 1)
        leaves.position.set(trunk.position.x,trunk.position.y + 2, trunk.position.z)
        scene.add(leaves);

        let tree = {
            trunk  : trunk,
            leaves : leaves
        }
        
        return tree;
    }

    const clouds = [];
    for (let i = 0; i < 15; i++) {
        var b1 = makeCloud();
        clouds.push(b1);
    }

    // trees
    const trees = [];
    for (let i = 0; i < 200; i++) {
        var b1 = makeTree();
        trees.push(b1);
    }

    // bee hive
    const beeYellow = 0xF7EF33;
    const connecterPos = [0.05,4.04,2.3];
    const hivePos = [0.05,3.4,2.3];
    let hive = null;
    {
        // honeycomb texture setup
        const honeyCombTex = loader.load('textures/hive.jpg')
        honeyCombTex.wrapS = THREE.RepeatWrapping;
        honeyCombTex.wrapT = THREE.RepeatWrapping;
        honeyCombTex.magFilter = THREE.NearestFilter;
        honeyCombTex.colorSpace = THREE.SRGBColorSpace;
        let lrepeats = 10;
        honeyCombTex.repeat.set(lrepeats, repeats);
        

        const connecter = makeInstance(cylinder_geometry, beeYellow, connecterPos);
        connecter.scale.set(.01,.1,.01);

        const material = new THREE.MeshPhongMaterial( {
            map: honeyCombTex
        } );
        hive = new THREE.Mesh( sphereGeo, material );
        hive.scale.x *= .5;
        hive.scale.z = hive.scale.x;
        hive.scale.y *= .6;

        hive.position.set(hivePos[0], hivePos[1], hivePos[2]);

        scene.add(hive);

        // set camera position to look at beehive
        camera.position.set(hivePos[0], hivePos[1], hivePos[2] + 5);
        control.target.set(hivePos[0], hivePos[1], hivePos[2]);
    }

    function growHive(hive) {
        let scale_fac = 1.05;
        let [x, y, z] = [hive.scale.x, hive.scale.y, hive.scale.z].map(x => x * scale_fac);
        hive.scale.set(x, y, z);
        hive.position.y -= hive.scale.y * .045;
    }

    // make honey
    function makeHoney() {
        let honeyBall = makeInstance(sphereGeo, beeYellow, [0,2,0]);
        honeyBall.scale.set(.05,.1,.05);
        return honeyBall;
    }

    // make bee
    function makeBee() {
        const beeTex = loader.load('textures/bee.jpg')

        const material = new THREE.MeshPhongMaterial( {
            map: beeTex
        } );

        let body = new THREE.Mesh(sphereGeo, material);
        body.scale.set(.03, .05, .03);
        body.rotateZ(Math.PI/2)
        body.position.set(hivePos[0], hivePos[1], hivePos[2])
        scene.add(body);

        let haveHoney = false;

        let bee = {
            body: body,
            haveHoney: haveHoney,
            honey: null
        }

        return bee;
    }

    // bees
    let beeNum = 0;
    let bees = [];

    // resize renderer to size of canvas
    function resizeRendererToDisplaySize( renderer ) {

		const canvas = renderer.domElement;
		const width = canvas.clientWidth;
		const height = canvas.clientHeight;
		const needResize = canvas.width !== width || canvas.height !== height;
		if ( needResize ) {

			renderer.setSize( width, height, false );

		}

		return needResize;

	}

    // render
    let beeSpeed = 0.07;
    function render(time) {
       
        time *= 0.001;
        let rate = 3;

        if (Math.floor(time) > rate*beeNum) {
            beeNum += 1;
            let bee = makeBee();
            bees.push(bee);
        }

        if ( resizeRendererToDisplaySize( renderer ) ) {

			const canvas = renderer.domElement;
			camera.aspect = canvas.clientWidth / canvas.clientHeight;
			camera.updateProjectionMatrix();

		}

        clouds.forEach( ( cloud, ndx ) => {
            const speed = .0005 * ndx + .002;
            const move = speed;
            cloud.forEach((comp) => {
                if (comp.position.x > 60) comp.position.x = -60
                comp.position.x += move;
            });
        });

        if (hive.scale.x <= 1) {
            bees.forEach( ( bee, ind ) => {
                let y = hivePos[1];

                let randTree = trees[ind];
                let tree_x = randTree.leaves.position.x;
                let tree_z = randTree.leaves.position.z;
                
                // determine if going towards or away from tree
                let dx = (tree_x - bee.body.position.x);
                let dz = (tree_z - bee.body.position.z);
                if (dist(bee.body.position.x, randTree.leaves.position.x, bee.body.position.z, randTree.leaves.position.z) < 1) {
                    bee.haveHoney = true;
                } else if (dist(bee.body.position.x, hivePos[0], bee.body.position.z, hivePos[2]) < .1) {
                    if (bee.haveHoney) {
                        growHive(hive);
                    }
                    bee.haveHoney = false;
                }
                let mag = Math.sqrt(dx*dx + dz*dz);
                dx /= mag;
                dz /= mag;

                if (!bee.haveHoney) {
                    scene.remove(bee.honey);
                    bee.honey = null;
                    bee.body.position.x += dx*beeSpeed;
                    bee.body.position.z += dz*beeSpeed;
                } else {
                    if (bee.honey === null) {
                        bee.honey = makeHoney();
                        scene.add(bee.honey);
                    }
                    bee.honey.position.set(bee.body.position.x, bee.body.position.y - 0.1, bee.body.position.z)
                    bee.body.position.x -= dx*beeSpeed;
                    bee.body.position.z -= dz*beeSpeed;
                }
                bee.body.position.y = .3*Math.cos(3*time) + y;
            })
        } else {
            beeSpeed *= .99;
            bees.forEach( ( bee, ind ) => {
                let y = hivePos[1];

                let randTree = trees[ind];
                let tree_x = randTree.leaves.position.x;
                let tree_z = randTree.leaves.position.z;
                
                // determine if going towards or away from tree
                let dx = (tree_x - bee.body.position.x);
                let dz = (tree_z - bee.body.position.z);
                if (dist(bee.body.position.x, randTree.leaves.position.x, bee.body.position.z, randTree.leaves.position.z) < 1) {
                    bee.haveHoney = true;
                } else if (dist(bee.body.position.x, hivePos[0], bee.body.position.z, hivePos[2]) < .1) {
                    if (bee.haveHoney) {
                        growHive(hive);
                    }
                    bee.haveHoney = false;
                }
                let mag = Math.sqrt(dx*dx + dz*dz);
                dx /= mag;
                dz /= mag;

                if (!bee.haveHoney) {
                    scene.remove(bee.honey);
                    bee.honey = null;
                    bee.body.position.x += dx*beeSpeed;
                    bee.body.position.z += dz*beeSpeed;
                } else {
                    if (bee.honey === null) {
                        bee.honey = makeHoney();
                        scene.add(bee.honey);
                    }
                    bee.honey.position.set(bee.body.position.x, bee.body.position.y - 0.1, bee.body.position.z)
                    bee.body.position.x -= dx*beeSpeed;
                    bee.body.position.z -= dz*beeSpeed;
                }
                bee.body.position.y = .3*Math.cos(3*time) + y;
            })

            if (hive.position.y >= 1) {
                hive.position.y -= .05;
            } else if (hive.scale.y > .1) {
                hive.position.y -= .05;
                hive.scale.y -= .08;
            }

        }

        renderer.render(scene, camera);
       
        requestAnimationFrame(render);
      }
    requestAnimationFrame(render);

    // lighting
    const ambColor = 0xFFFFFF;
    const ambInt = .4;
    const ambient = new THREE.AmbientLight(ambColor, ambInt);
    scene.add(ambient);

    const skyColor = 0x87CEEB;
    const groundColor = 0x136D15;
    const hemiInt = 1;
    const hemisphere = new THREE.HemisphereLight(skyColor, groundColor, hemiInt);
    scene.add(hemisphere)

    const sunColor = 0xFEFCE4;
    const sunInt = 5;
    const sun = new THREE.DirectionalLight(sunColor, sunInt);
    sun.position.set(5, 5, 5);
    scene.add(sun);

    const fillInt = 1;
    const fill = new THREE.DirectionalLight(sunColor, fillInt);
    fill.position.set(-5, 1, 5)
    scene.add(fill);

    
}