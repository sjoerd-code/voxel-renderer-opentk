#version 430 core

layout(location = 0) in vec3 aPosition;

out vec2 UVcoord;

void main(void)
{
    gl_Position = vec4(aPosition, 1.0);
    UVcoord = vec2(aPosition.x, aPosition.y);
}