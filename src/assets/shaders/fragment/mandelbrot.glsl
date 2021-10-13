
precision highp float;
varying float v_iterations;
varying float v_colormode;
varying float v_modifiermode;
varying vec2 v_position;

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

#define PI 3.14159265
#define cx_sub(a, b) vec2(a.x - b.x, a.y - b.y)
#define cx_add(a, b) vec2(a.x + b.x, a.y + b.y)
#define cx_abs(a) sqrt(a.x * a.x + a.y * a.y)
#define cx_mul(a, b) vec2(a.x*b.x-a.y*b.y, a.x*b.y+a.y*b.x)
#define cx_div(a, b) vec2(((a.x*b.x+a.y*b.y)/(b.x*b.x+b.y*b.y)),((a.y*b.x-a.x*b.y)/(b.x*b.x+b.y*b.y)))
#define cx_modulus(a) length(a)
#define cx_conj(a) vec2(a.x,-a.y)
#define cx_arg(a) atan2(a.y,a.x)
#define cx_sin(a) vec2(sin(a.x) * cosh(a.y), cos(a.x) * sinh(a.y))
#define cx_cos(a) vec2(cos(a.x) * cosh(a.y), -sin(a.x) * sinh(a.y))
vec2 cx_to_polar(vec2 a) {
    float phi = atan(a.x, a.y);
    float r = sqrt(a.x * a.x + a.y * a.y);    
    return vec2(r, phi); 
}
vec2 cx_sqrt(vec2 a) {
    float r = sqrt(a.x*a.x+a.y*a.y);
    float rpart = sqrt(0.5*(r+a.x));
    float ipart = sqrt(0.5*(r-a.x));
    if (a.y < 0.0) ipart = -ipart;
    return vec2(rpart,ipart);
}
vec2 cx_tan(vec2 a) {return cx_div(cx_sin(a), cx_cos(a)); }
vec2 cx_log(vec2 a) {
    float rpart = sqrt((a.x*a.x)+(a.y*a.y));
    float ipart = atan(a.y,a.x);
    if (ipart > PI) ipart=ipart-(2.0*PI);
    return vec2(log(rpart),ipart);
}
vec2 cx_mobius(vec2 a) {
    vec2 c1 = a - vec2(1.0,0.0);
    vec2 c2 = a + vec2(1.0,0.0);
    return cx_div(c1, c2);
}
vec2 cx_z_plus_one_over_z(vec2 a) {
    return a + cx_div(vec2(1.0,0.0), a);
}
vec2 cx_z_squared_plus_c(vec2 z, vec2 c) {
    return cx_mul(z, z) + c;
}
vec2 cx_sin_of_one_over_z(vec2 z) {
    return cx_sin(cx_div(vec2(1.0,0.0), z));
}




vec2 fractal;
float mandelbrot_0() {
    float current_iterations = 0.0;
    while (fractal.x*fractal.x+fractal.y*fractal.y < 4.0 && current_iterations < v_iterations) {
        fractal = v_position + vec2(
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
        fractal = v_position + vec2(
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
        fractal = v_position + vec2(
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
        fractal = v_position + vec2(
            fractal_xx * fractal_xx - 6.0 * fractal_xx * fractal_yy + fractal_yy * fractal_yy,
            4.0 * fractal.x * fractal.y * (fractal_xx - fractal_yy)
        );
        current_iterations++;
    }
    return current_iterations;
}


// z^3 - 1
vec2 f(vec2 z) {
    return cx_mul(cx_mul(z, z), z) - vec2(1.0, 0.0);
} 
// f(z) derivated
// 3*z^2
vec2 fPrim(vec2 z) {
    return cx_mul(cx_mul(z, z), vec2(3.0,0.0));
}
vec2 one = vec2(1, 0);
float mandelbrot_4() {
    vec2 z = v_position.xy;
    vec2 roots[5] = vec2[5](
        vec2(-0.5, -0.8660254037844),
        vec2(-0.5, 0.8660254037844),
        vec2(1, 0),
        vec2(1, 0),
        vec2(1, 0)
    );

    vec2 oldZ = z;
    float s = 0.0;
    float iterations = 0.0;
    while(iterations < v_iterations){
        z = cx_sub(z, cx_div(f(z), fPrim(z))); 

        bool found = false;
        for (int i = 0; i < 5; i++) {
            if (abs(z.x - roots[i].x) < 0.00001 && abs(z.y - roots[i].y) < 0.00001) {
                found = true;
                break;
            }
        }

        if (found) {
            break;
        }
        
        vec2 w = cx_div(one, cx_sub(oldZ, z));
        float wAbs = cx_abs(w);
        
        s += exp(-wAbs);
        oldZ = z;
        iterations++;
    }
    return iterations;
}


void main () {
    fractal = vec2(0.0, 0.0);
    float current_iterations = 0.0;

    if (v_modifiermode == 0.0) {
        current_iterations = mandelbrot_0();
    } else if (v_modifiermode == 1.0) {
        current_iterations = mandelbrot_1();
    } else if (v_modifiermode == 2.0) {
        current_iterations = mandelbrot_2();
    } else if (v_modifiermode == 3.0) {
        current_iterations = mandelbrot_3();
    } else if (v_modifiermode == 4.0) {
        current_iterations = mandelbrot_4();
    }

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
