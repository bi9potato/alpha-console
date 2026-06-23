# Alpha Console 汇率监控网页

这是一个基于 Vite + React 的汇率监控网页，已经可以构建成静态站点，并通过 Nginx/Docker 部署到服务器，让所有人通过公网 IP 或域名访问。

## 本地运行

```bash
npm ci
npm run start
```

开发服务器默认会监听 `0.0.0.0`，终端会显示可访问地址。

## 生产构建

```bash
npm ci
npm run build
```

构建结果会输出到 `dist/`，可以直接放到任意静态网站服务器（Nginx、Caddy、对象存储静态托管等）。

## 用 Docker 部署到服务器

服务器需要先安装 Docker，并开放公网防火墙的 80 端口。

1. 在服务器拉取或上传本仓库代码。
2. 在项目根目录构建镜像：

   ```bash
   docker build -t alpha-console .
   ```

3. 启动容器：

   ```bash
   docker run -d --name alpha-console --restart unless-stopped -p 80:80 alpha-console
   ```

4. 浏览器访问：

   ```text
   http://服务器公网IP/
   ```

如果有域名，把域名的 A 记录解析到服务器公网 IP 后访问：

```text
http://你的域名/
```

## 用 HTTPS 对外访问

推荐在服务器上使用 Caddy、Nginx Proxy Manager 或云厂商负载均衡配置 HTTPS。最简单的 Caddy 示例：

```caddyfile
你的域名 {
  reverse_proxy 127.0.0.1:80
}
```

配置 HTTPS 前，请先确认域名已经解析到服务器，并且 80/443 端口已开放。

## 常用运维命令

```bash
# 查看容器状态
docker ps

# 查看访问/错误日志
docker logs -f alpha-console

# 更新部署：重新构建镜像并替换容器
docker build -t alpha-console .
docker rm -f alpha-console
docker run -d --name alpha-console --restart unless-stopped -p 80:80 alpha-console
```

## 注意事项

- 汇率数据会在浏览器端请求 Frankfurter API；如果访问者网络无法连接该 API，页面会显示内置基准价并提示接口异常。
- 如果服务器已有 Nginx 占用 80 端口，可以把容器映射到其他端口，例如 `-p 8080:80`，再由现有 Nginx 反向代理到 `127.0.0.1:8080`。
