
precision highp float;
varying float v_iterations;
varying float v_colormode;
varying float v_modifiermode;
varying vec2 v_position;
varying vec2 v_cursor_position;

#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif

float aastep(float threshold, float value) {
  #ifdef GL_OES_standard_derivatives
    float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;
    return smoothstep(threshold-afwidth, threshold+afwidth, value);
  #else
    return step(threshold, value);
  #endif  
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec2 fractal;
float mandelbrot_0() {
    float current_iterations = 0.0;
    while (fractal.x*fractal.x+fractal.y*fractal.y < 4.0 && current_iterations < v_iterations) {
        fractal = v_cursor_position + vec2(
            fractal.x * fractal.x - fractal.y * fractal.y,
            2.0 * fractal.x * fractal.y
        );
        current_iterations++;
    }
    return current_iterations;
}

float mandelbrot_1() {
    float current_iterations = 0.0;
    while ((fractal.x < 2.0 || fractal.y < 2.0) && current_iterations < v_iterations) {
        fractal = v_cursor_position + vec2(
            fractal.x * fractal.x - fractal.y * fractal.y,
            2.0 * fractal.x * fractal.y
        );
        current_iterations++;
    }
    return current_iterations;
}

float mandelbrot_2() {
    float current_iterations = 0.0;
    while (fractal.x*fractal.x+fractal.y*fractal.y < 4.0 && current_iterations < v_iterations) {
        float fractal_xx = fractal.x * fractal.x;
        float fractal_xy = fractal.x * fractal.y;
        float fractal_yy = fractal.y * fractal.y;
        fractal = v_cursor_position + vec2(
            fractal.x * fractal_xx - fractal_yy * fractal.x - 2.0 * fractal_yy,
            2.0 * fractal_xy + fractal_xx * fractal.y - fractal_yy * fractal.y
        );
        current_iterations++;
    }
    return current_iterations;
}

float mandelbrot_3() {
    float current_iterations = 0.0;
    while (fractal.x*fractal.x+fractal.y*fractal.y < 4.0 && current_iterations < v_iterations) {
        float fractal_xx = fractal.x * fractal.x;
        float fractal_yy = fractal.y * fractal.y;
        fractal = v_cursor_position + vec2(
            fractal_xx * fractal_xx - 6.0 * fractal_xx * fractal_yy + fractal_yy * fractal_yy,
            4.0 * fractal.x * fractal.y * (fractal_xx - fractal_yy)
        );
        current_iterations++;
    }
    return current_iterations;
}


void main() {
    fractal = v_position.xy;

    float current_iterations = 0.0;
    if (v_modifiermode == 0.0) {
        current_iterations = mandelbrot_0();
    } else if (v_modifiermode == 1.0) {
        current_iterations = mandelbrot_1();
    } else if (v_modifiermode == 2.0) {
        current_iterations = mandelbrot_2();
    } else if (v_modifiermode == 3.0) {
        current_iterations = mandelbrot_3();
    }


    // Assign colors
    if (current_iterations >= v_iterations) {
        gl_FragColor = vec4(0, 0, 0, 1);
    } else {
        if (v_colormode == 1.0) {
            float smooth_value = current_iterations - log(log(length(fractal)) / log(4.0)) / log(2.0);
            float red = smooth_value / 256.0;
            float green = 1.0;
            float blue = smooth_value / (smooth_value + 8.0);
            gl_FragColor = vec4(hsv2rgb(vec3(red, green, blue)), 1);
        } else if (v_colormode == 0.0) {
            float red = current_iterations / 256.0;
            float green = 1.0;
            float blue = current_iterations / (current_iterations + 8.0);
            gl_FragColor = vec4(hsv2rgb(vec3(red, green, blue)), 1);
        } else if (v_colormode == 2.0) {
            float aa = 0.8;
            float red = aastep(aa, current_iterations / 256.0);
            float green = aastep(aa, 1.0);
            float blue = aastep(aa, current_iterations / (current_iterations + 8.0));
            gl_FragColor = vec4(hsv2rgb(vec3(red, green, blue)), 1);
        }

        
    }

}
