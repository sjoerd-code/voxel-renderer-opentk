using OpenTK.Windowing.Common;
using OpenTK.Windowing.Desktop;
using OpenTK.Graphics.OpenGL;
using OpenTK.Mathematics;

namespace opentkproject
{
    public class Window : GameWindow
    {
        private int vertexBufferHandle;
        private int shaderProgramHandle;
        private int vertexArrayHandle;

        private float timePassed;
        private Vector2i screenSize = new Vector2i(1280, 720);

        public Window() : base(GameWindowSettings.Default, NativeWindowSettings.Default)
        {
            this.CenterWindow(new Vector2i(screenSize.X, screenSize.Y));
        }

        protected override void OnResize(ResizeEventArgs args)
        {
            screenSize = args.Size;
            GL.Viewport(0, 0, screenSize.X, screenSize.Y);
            base.OnResize(args);
        }

        protected override void OnLoad()
        {
            GL.ClearColor(new Color4(0.3f, 0.4f, 0.5f, 1f));

            // setup shader renderer
            CreateFullScreenQuadFromTwoPolygons();
            CreateShaderProgram("shader.vert", "shader.frag");

            base.OnLoad();
        }

        protected override void OnUnload()
        {
            // destroy buffers and shader program
            GL.BindBuffer(BufferTarget.ArrayBuffer, 0);
            GL.DeleteBuffer(vertexBufferHandle);
            GL.UseProgram(0);
            GL.DeleteProgram(shaderProgramHandle);
            base.OnUnload();
        }

        protected override void OnUpdateFrame(FrameEventArgs args)
        {
            timePassed += (float)args.Time;
            base.OnUpdateFrame(args);
        }

        protected override void OnRenderFrame(FrameEventArgs args)
        {
            // clear color buffer
            GL.Clear(ClearBufferMask.ColorBufferBit);

            // pass uniform variables to shader program
            GL.UseProgram(shaderProgramHandle);
            GL.Uniform2(GL.GetUniformLocation(shaderProgramHandle, "resolution"), (float)screenSize.X, (float)screenSize.Y);
            GL.Uniform1(GL.GetUniformLocation(shaderProgramHandle, "iTime"), timePassed);
            GL.Uniform1(GL.GetUniformLocation(shaderProgramHandle, "voxelTracing"), 1);
            GL.Uniform1(GL.GetUniformLocation(shaderProgramHandle, "voxelNormal"), 0);
            GL.Uniform1(GL.GetUniformLocation(shaderProgramHandle, "MAX_MARCHING_STEPS"), 400);
            GL.Uniform1(GL.GetUniformLocation(shaderProgramHandle, "cameraDistance"), 120f);
            GL.Uniform1(GL.GetUniformLocation(shaderProgramHandle, "objectSize"), 140f);

            // render
            GL.UseProgram(shaderProgramHandle);
            GL.BindVertexArray(vertexArrayHandle);
            GL.DrawArrays(PrimitiveType.Triangles, 0, 6);
            this.Context.SwapBuffers();
            base.OnRenderFrame(args);
        }

        private void CreateShaderProgram(string vertexShaderPath, string fragmentShaderPath)
        {
            string vertexShaderCode = File.ReadAllText(vertexShaderPath);
            string fragmentShaderCode = File.ReadAllText(fragmentShaderPath);

            int vertexShaderHandle = GL.CreateShader(ShaderType.VertexShader);
            GL.ShaderSource(vertexShaderHandle, vertexShaderCode);
            GL.CompileShader(vertexShaderHandle);

            int fragmentShaderHandle = GL.CreateShader(ShaderType.FragmentShader);
            GL.ShaderSource(fragmentShaderHandle, fragmentShaderCode);
            GL.CompileShader(fragmentShaderHandle);

            shaderProgramHandle = GL.CreateProgram();
            GL.AttachShader(shaderProgramHandle, vertexShaderHandle);
            GL.AttachShader(shaderProgramHandle, fragmentShaderHandle);
            GL.LinkProgram(shaderProgramHandle);

            GL.DetachShader(shaderProgramHandle, vertexShaderHandle);
            GL.DetachShader(shaderProgramHandle, fragmentShaderHandle);

            GL.DeleteShader(vertexBufferHandle);
            GL.DeleteShader(fragmentShaderHandle);
        }

        private void CreateFullScreenQuadFromTwoPolygons()
        {
            float[] vertices = new float[]
            {
                -1f, 1f, 0f,
                1f, 1f, 0f,
                -1f, -1f, 0f,
                1f, 1f, 0f,
                1f, -1f, 0f,
                -1f, -1f, 0f,
            };

            vertexBufferHandle = GL.GenBuffer();
            GL.BindBuffer(BufferTarget.ArrayBuffer, vertexBufferHandle);
            GL.BufferData(BufferTarget.ArrayBuffer, vertices.Length * sizeof(float), vertices, BufferUsageHint.StaticDraw);
            GL.BindBuffer(BufferTarget.ArrayBuffer, 0);

            vertexArrayHandle = GL.GenVertexArray();
            GL.BindVertexArray(vertexArrayHandle);
            GL.BindBuffer(BufferTarget.ArrayBuffer, vertexBufferHandle);
            GL.VertexAttribPointer(0, 3, VertexAttribPointerType.Float, false, 3 * sizeof(float), 0);
            GL.EnableVertexAttribArray(0);
            GL.BindVertexArray(0);
        }
    }
}