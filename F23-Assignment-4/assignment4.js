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
            this.box_1_transform = this.box_1_transform.times(Mat4.rotation((10*dt*2*Math.PI)/60, 1, 0, 0));
            this.box_2_transform = this.box_2_transform.times(Mat4.rotation((15*dt*2*Math.PI)/60, 0, 1, 0));
            /*can't use different variable for LHS (i.e. box_1_rotation) because what is drawn depends on only one variable.
            * at the beginning, we draw it as is the box_transform in the constructor. once we press c, the cubes begin rotating
            * at the specified angular velocity. once we press c again, the cubes are drawn according to the box_transform matrix.
            * this matrix now has the value of the rotating box_transform (it's one matrix that constantly changes, but without
            * moving because it's not rotating. we use dt instead of t in the angle because t would continue to build on itself and grow speed as
            * we are using a single box_transform matrix. dt is the time at an instant, so it can rotate according to the program at an instant.
            * when we use dt, the boxes rotate according to some miniscule value of the time that changes
            * depending on the animation_time. we must put the original box_transform in the constructor because we don't want it to
            * reset the box_transform matrix when we are using it for rotation. the display() runs multiple times, not just once.*/
        }

        this.shapes.box_1.draw(context, program_state, this.box_1_transform, this.materials.starsText);
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
                float scroll_factor = -2.00 * animation_time;
                vec2 scroll_tex_coord = vec2(f_tex_coord.x + scroll_factor, f_tex_coord.y);
                vec4 tex_color = texture2D( texture, scroll_tex_coord);
                if( tex_color.w < .01 ) discard;
                                                                         // Compute an initial (ambient) color:
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                         // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
                
                /*Reset the texture coordinates passed into the GLSL's texture2D call periodically so they do
                not continue to grow forever, which could cause the interpolated values to lose needed decimal precision 
                */
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
                // Sample the texture image in the correct place:
                vec4 tex_color = texture2D( texture, f_tex_coord );
                if( tex_color.w < .01 ) discard;
                                                                         // Compute an initial (ambient) color:
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                         // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}

