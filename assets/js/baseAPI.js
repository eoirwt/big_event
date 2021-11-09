// 注意：每次调用 $.get() 或 $.post() 或 $.ajax() 的时候，
// 会先调用 ajaxPrefilter 这个函数
// 在这个函数中，可以拿到我们给Ajax提供的配置对象
$.ajaxPrefilter( function( options ) { 
    // options 为 Ajax 的配置对象, 其中 options.url 为请求地址
    
    // 1. 在发起真正的 Ajax 请求之前，统一拼接请求的根路径
    options.url = 'http://api-breakingnews-web.itheima.net' + options.url;
    
    if(options.url.indexOf('/my/') !== -1){
        // 2. options.headers 为Ajax请求 请求头的配置对象
        options.headers = {
            Authorization: localStorage.getItem('token') || ''
        }    
    }

    // 3. 不论成功还是失败，最终都会调用 complete 回调函数进行身份验证
    options.complete = function(res) {
        // console.log('执行了 complete 回调：')
        // console.log(res)
        // 在 complete 回调函数中，可以使用 res.responseJSON 拿到服务器响应回来的数据
        if(res.responseJSON.status == 1 && res.responseJSON.message == '身份认证失败！'){
            // 1. 强制清空 token
            localStorage.removeItem('token');
            // 2. 强制跳转到登录页面
            location.href = '/login.html';
        }
    }
  });