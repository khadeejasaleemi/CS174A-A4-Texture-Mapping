import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {Cube, Axis_Arrows, Textured_Phong} = defs

export class Assignment4 extends Scene {
    arrays;
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        this.cubeRotation = false;

        // TODO:  Create two cubes, including one with the default texture coordinates (from 0 to 1), and one with the modified
        //        texture coordinates as required for cube #2.  You can either do this by modifying the cube code or by modifying
        //        a cube instance's texture_coords after it is already created.
        this.shapes = {
            box_1: new Cube(),
            box_2: new Cube(),
            axis: new Axis_Arrows()
        }
        console.log(this.shapes.box_1.arrays.texture_coord)


        // TODO:  Create the materials required to texture both cubes with the correct images and settings.
        //        Make each Material from the correct shader.  Phong_Shader will work initially, but when
        //        you get to requirements 6 and 7 you will need different ones.
        this.materials = {
            phong: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
            }),
            starsText: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1.0, /*diffusivity: 0.1, specularity: 0.1,*/
                texture: new Texture("assets/stars.png", "NEAREST")
            }),
            earthText: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1.0,
                texture: new Texture("assets/earth.gif", "LINEAR_MIPMAP_LINEAR")
            }),
            scrollText: new Material(new Texture_Scroll_X(), {
                color: hex_color("#000000"),
                ambient: 1.0,
                texture: new Texture("assets/earth.gif", "LINEAR_MIPMAP_LINEAR")
            }),
            rotateText: new Material(new Texture_Rotate(), {
                color: hex_color("#000000"),
                ambient: 1.0, /*diffusivity: 0.1, specularity: 0.1,*/
                texture: new Texture("assets/stars.png", "NEAREST")
            }),

        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));

        this.box_1_transform = Mat4.translation(-2,0,0);
        this.box_2_transform = Mat4.translation(2,0,0);
        this.shapes.box_2.arrays.texture_coord.forEach(
            (v, i, l) => l[i] = vec(v[0] * 2, v[1] * 2)
        )
    }

    make_control_panel() {
        // TODO:  Implement requirement #5 using a key_triggered_button that responds to the 'c' key.
        this.key_triggered_button("Cube rotation", ["c"], function ()  {
            this.cubeRotation ^= 1;
        });

    }

    display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.translation(0, 0, -8));
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        const light_position = vec4(10, 10, 10, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        let t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        let model_transform = Mat4.identity();

        // TODO:  Draw the required boxes. Also update their stored matrices.
        // You can remove the following line.

        if (this.cubeRotation) {
            //use the single variable box_transform rather than multiple matrices
            //--> this way, the matrix's rotation angle will carry over even when cube rotation is not active
            //use dt instead of t - smooth transition when starting/stopping cubes (uses time at a specific moment).
            //moved original box_transform matrices into constructor to prevent them from resetting when display() is called
            this.box_1_transform = this.box_1_transform.times(Mat4.rotation((10*dt*2*Math.PI)/60, 1, 0, 0));
            //box 1: 10 rpm. 2pi/60 represents the angle over the time (2pi is one full rotation, and 60s in a minute).
            this.box_2_transform = this.box_2_transform.times(Mat4.rotation((15*dt*2*Math.PI)/60, 0, 1, 0));
            //box 2: 15rpm.
        }

        this.shapes.box_1.draw(context, program_state, this.box_1_transform, this.materials.rotateText);
        this.shapes.box_2.draw(context, program_state, this.box_2_transform, this.materials.scrollText);

        }

}


class Texture_Scroll_X extends Textured_Phong {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Textured_Phong) for requirement #6.
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            
            void main(){
                // Sample the texture image in the correct place:
                float scroll_factor = -2.00 * mod(animation_time, 60.00);
                vec2 scroll_tex_coord = vec2(f_tex_coord.x + scroll_factor, f_tex_coord.y);
                vec4 tex_color = texture2D( texture, scroll_tex_coord);
                
                //TEXTURE COORD AXIS FROM 0 TO 1 (U,V)
                float u = mod(scroll_tex_coord.x, 1.0);
                float v = mod(scroll_tex_coord.y, 1.0);
                
                //bottom line of square
                if (u > .15 && u < .85 && v > .15 && v < .25)
                    tex_color = vec4(0.00, 0.00, 0.00, 1.00);
                
                //left
                if (u > .15 && u < .25 && v > .15 && v < .85)
                    tex_color = vec4(0.00, 0.00, 0.00, 1.00);
                
                //top  
                if (u > .15 && u < .85 && v > .75 && v < .85)
                    tex_color = vec4(0.00, 0.00, 0.00, 1.00);
                
                //right
                if (u > .75 && u < .85 && v > .15 && v < .85)
                    tex_color = vec4(0.00, 0.00, 0.00, 1.00);
                
                if( tex_color.w < .01 ) discard;
            
                                                                         // Compute an initial (ambient) color:
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                         // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
                                
        } `;
    }
}


class Texture_Rotate extends Textured_Phong {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Textured_Phong) for requirement #7.
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            void main(){
                // Sample the texture image in the correct place
               
                float rot_factor = ( 20.00*mod(animation_time, 60.00)*2.00*3.141592653 )/60.00;
                mat4 rotMatrix = mat4(
                vec4(cos(rot_factor), sin(rot_factor), 0.00, 0.00), 
                vec4(-sin(rot_factor), cos(rot_factor), 0.00, 0.00), 
                vec4( 0.00, 0.00, 1.00, 0.00), 
                vec4(0.00, 0.00, 0.00, 1.00));
                                                  
                vec4 rotate_tex_coord = vec4(-0.50, -0.50, 0.00, 0.00) + vec4(f_tex_coord, 0.00, 0.00);
                rotate_tex_coord = vec4(0.50, 0.50, 0.00, 0.00) + (rotate_tex_coord * rotMatrix);
                
                vec4 tex_color = texture2D( texture, rotate_tex_coord.xy );
                    
                //TEXTURE COORD AXIS FROM 0 TO 1 (U,V)
                float u = mod(rotate_tex_coord.x, 1.0);
                float v = mod(rotate_tex_coord.y, 1.0);
                
                //bottom line of square
                if (u > .15 && u < .85 && v > .15 && v < .25)
                    tex_color = vec4(0.00, 0.00, 0.00, 1.00);
                
                //left
                if (u > .15 && u < .25 && v > .15 && v < .85)
                    tex_color = vec4(0.00, 0.00, 0.00, 1.00);
                
                //top  
                if (u > .15 && u < .85 && v > .75 && v < .85)
                    tex_color = vec4(0.00, 0.00, 0.00, 1.00);
                
                //right
                if (u > .75 && u < .85 && v > .15 && v < .85)
                    tex_color = vec4(0.00, 0.00, 0.00, 1.00);
                                        
                if( tex_color.w < .01 ) discard;                                   
                             
                                                                         // Compute an initial (ambient) color:
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                         // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}

