#!/bin/bash

# # 代理服务器地址和端口
proxy_address="127.0.0.1"
proxy_port="4780"

# # 要代理的应用程序名称
app_name="allAI"

# # 设置代理
networksetup -setwebproxy Wi-Fi $proxy_address $proxy_port
networksetup -setsecurewebproxy Wi-Fi $proxy_address $proxy_port

# # 启动应用程序
HTTPS_PROXY=$proxy_address:$proxy_port open -a "$app_name"