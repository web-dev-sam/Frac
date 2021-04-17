
precision highp float;
uniform float u_window_ratio;
uniform float u_iterations;
uniform float u_colormode;
uniform float u_modifiermode;
uniform vec2 u_offset;
uniform vec2 u_cursor_position;

varying float v_iterations;
varying float v_colormode;
varying float v_modifiermode;
varying vec2 v_position;
varying vec2 v_cursor_position;

float map(float value, float min1, float max1, float min2, float max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

void main() {
    float inv_zoom = 1.5;
    float area_x = map(position.x, -0.5, 0.5, u_offset.x-inv_zoom*u_window_ratio, u_offset.x+inv_zoom*u_window_ratio);
    float area_y = map(position.y, -0.5, 0.5, u_offset.y-inv_zoom, u_offset.y+inv_zoom);

    v_position = vec2(area_x, area_y);
    v_iterations = u_iterations;
    v_colormode = u_colormode;
    v_modifiermode = u_modifiermode;
    v_cursor_position = u_cursor_position;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}