#version 430 core

in vec2 UVcoord;
out vec4 fragColor;

const float EPSILON = 0.01;

uniform vec2 resolution;
uniform float iTime;
uniform bool voxelTracing;
uniform bool voxelNormal;
uniform int MAX_MARCHING_STEPS;
uniform float cameraDistance;
uniform float objectSize;

const vec3[6] speeds = vec3[6] 
(
	vec3(0.764, 1.175, 1.035),
    vec3(1.32, 1.227, 0.9745),
    vec3(0.834, 0.734, 1.263),
    vec3(1.1623, 0.933, 0.7373),
    vec3(0.9347, 1.3734, 0.834),
    vec3(0.853, 1.2745, 0.972)
);
const vec3[6] ranges = vec3[6] 
(
	vec3(0.5273, 1.8347, 1.0734),
	vec3(0.846, 2.384, 0.7346),
	vec3(0.7234, 1.377, 0.982),
	vec3(0.62485, 1.927, 0.5273),
	vec3(0.982, 1.73435, 0.8245),
	vec3(0.5834, 2.572, 0.6725)
);

float sceneSDF(vec3 p) 
{
    float size = objectSize;
    float rangeScale = sqrt(objectSize * 1.5);
    float speedScale = 0.5;
    float den = 0.;
    for (float i = .0; i < 5.; ++i) 
    {
        vec3 c = sin((iTime + 8) * (speeds[int(i)]) * speedScale) * (ranges[int(i)] * rangeScale) + vec3(0., 0., 2.);
        vec3 dis = c - p;
        float x = dot(dis, dis);
        den += .8 * size / x;
    }
    if (den < 0.333) return 2.;
    else return 1. / den - 1.;
}

float SphereTrace(vec3 eye, vec3 marchingDirection)
{
    float depth = 0;
    for (int i = 0; i < MAX_MARCHING_STEPS; i++)
    {
        float dist = sceneSDF(eye + depth * marchingDirection);
        if (dist < EPSILON) 
        {
			return depth;
        }
        depth += dist;
    }
    return 0;
}

vec3 VoxelTrace(vec3 eye, vec3 marchingDirection)
{
    vec3 rayOrigin = eye;
    vec3 rayDirection = marchingDirection;
    vec3 cellDimension = vec3(1, 1, 1);

    vec3 voxelcoord;

    vec3 deltaT, nextCrossingT;
    float t_x, t_y, t_z;

    // initializing values
    if (rayDirection[0] < 0)
    {
        deltaT[0] = -cellDimension[0] / rayDirection[0];
        t_x = (floor(rayOrigin[0] / cellDimension[0]) * cellDimension[0]- rayOrigin[0]) / rayDirection[0];
    }
    else 
    {
        deltaT[0] = cellDimension[0] / rayDirection[0];
        t_x = ((floor(rayOrigin[0] / cellDimension[0]) + 1) * cellDimension[0] - rayOrigin[0]) / rayDirection[0];
    }
    if (rayDirection[1] < 0) 
    {
        deltaT[1] = -cellDimension[1] / rayDirection[1];
        t_y = (floor(rayOrigin[1] / cellDimension[1]) * cellDimension[1] - rayOrigin[1]) / rayDirection[1];
    }
    else 
    {
        deltaT[1] = cellDimension[1] / rayDirection[1];
        t_y = ((floor(rayOrigin[1] / cellDimension[1]) + 1) * cellDimension[1] - rayOrigin[1]) / rayDirection[1];
    }
    if (rayDirection[2] < 0)
    {
        deltaT[2] = -cellDimension[2] / rayDirection[2];
        t_z = (floor(rayOrigin[2] / cellDimension[2]) * cellDimension[2] - rayOrigin[2]) / rayDirection[2];
    }
    else
    {
        deltaT[2] = cellDimension[2] / rayDirection[2];
        t_z = ((floor(rayOrigin[2] / cellDimension[2]) + 1) * cellDimension[2] - rayOrigin[2]) / rayDirection[2];
    }

    float t = 0;
    float stepsTraced = 0;
    vec3 cellIndex = floor(rayOrigin);
    while (true)
    {
        // if voxel is found
        if (sceneSDF(cellIndex) < 0)
        {
            voxelcoord = cellIndex;
            break;
        }

        // traverse grid
        if (t_x < t_y)
        {
            if (t_x < t_z)
            {
                t = t_x; // current t, next intersection with cell along ray 
                t_x += deltaT[0]; // increment, next crossing along x 
                if (rayDirection[0] < 0)
                    cellIndex[0] -= 1;
                else
                    cellIndex[0] += 1;
            }
            else
            {
                t = t_z; // current t, next intersection with cell along ray 
                t_z += deltaT[2]; // increment, next crossing along z
                if (rayDirection[2] < 0)
                    cellIndex[2] -= 1;
                else
                    cellIndex[2] += 1;
            }
        }
        else
        {
            if (t_y < t_z)
            {
                t = t_y;
                t_y += deltaT[1]; // increment, next crossing along y 
                if (rayDirection[1] < 0)
                    cellIndex[1] -= 1;
                else
                    cellIndex[1] += 1;
            }
            else
            {
                t = t_z;
                t_z += deltaT[2]; // increment, next crossing along z
                if (rayDirection[2] < 0)
                    cellIndex[2] -= 1;
                else
                    cellIndex[2] += 1;
            }
        }
        
        stepsTraced++;

        // if nothing found after max number of steps
        if (stepsTraced > MAX_MARCHING_STEPS)
        {
            voxelcoord = vec3(0, 0, 0);
            break;
        }
    }

    return voxelcoord;
}

vec3 VoxelNormal(vec3 coord)
{
    vec3 normal = vec3(0, 0, 0);
    int samplesize = 5;
    float t = samplesize / 2;
    
    for (int x = 0; x < samplesize; x++)
    {
        for (int y = 0; y < samplesize; y++)
        {
            for (int z = 0; z < samplesize; z++)
            {
                float a = x - t;
                float b = y - t;
                float c = z - t;
                if (sceneSDF(vec3(coord.x + a, coord.y + b, coord.z + c)) < 0) 
                {
                    normal += vec3(a, b, c);
                }
            }
        }
    }

    return -normalize(normal);
}

vec3 SDFnormal(vec3 p)
{
    return normalize(vec3(
        sceneSDF(vec3(p.x + EPSILON, p.y, p.z)) - sceneSDF(vec3(p.x - EPSILON, p.y, p.z)),
        sceneSDF(vec3(p.x, p.y + EPSILON, p.z)) - sceneSDF(vec3(p.x, p.y - EPSILON, p.z)),
        sceneSDF(vec3(p.x, p.y, p.z  + EPSILON)) - sceneSDF(vec3(p.x, p.y, p.z - EPSILON))
    ));
}

vec3 rayDirection(float fieldOfView, vec2 size, vec2 coord) 
{
    vec2 xy = coord - size / 2.0;
    float z = size.y / tan(radians(fieldOfView) / 2.0);
    return normalize(vec3(xy, -z));
}

void main()
{
    // camera
	vec3 dir = rayDirection(60.0, resolution, (UVcoord + 0.5) * resolution);
    vec3 eye = vec3(0.0, 0.0, cameraDistance);

    // marching & normal
    vec3 VoxelCoord;
    float dist;
    vec3 hitPos;
    vec3 normal;

    if (voxelTracing)
    {
        VoxelCoord = VoxelTrace(eye, dir);

        if (!voxelNormal)
            normal = SDFnormal(VoxelCoord);
        else
            normal = VoxelNormal(VoxelCoord);
    }
    else 
    {
        dist = SphereTrace(eye, dir);
        hitPos = eye + dist * dir;

        normal = SDFnormal(hitPos);
    }

    // diffuse
    vec3 lightPos = vec3(4000, 4000, 4000);
    float diffuse = max(0.0, dot(normalize(lightPos), normal));
    
    if ((!voxelTracing && dist == 0) || (voxelTracing && VoxelCoord == vec3(0, 0, 0)))
    {
        // Didn't hit anything
        fragColor = vec4(0.2, 0.2, 0.2, 1.0);
		return;
    }
    
    fragColor = vec4((normal * 0.5 + 0.5) * diffuse, 1.0);
}