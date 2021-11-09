$(function(){
    var layer = layui.layer;
    var form = layui.form;
    var laypage = layui.laypage;
    // 定义一个查询的参数对象，作为获取文章列表API的参数
    // 需要将请求参数对象提交到服务器
    var q = {
        pagenum: 1, // 页码值，默认请求第一页的数据
        pagesize: 2, // 每页显示几条数据，默认每页显示2条
        cate_id: '', // 文章分类的 Id
        state: '' // 文章的发布状态
    }

    // 模板的时间过滤器
    template.defaults.imports.dateFormat = function(date){
        var dt = new Date(date);

        var y = dt.getFullYear();
        var m = padZero(dt.getMonth() + 1);
        var d = padZero(dt.getDate());

        var hh = padZero(dt.getHours());
        var mm = padZero(dt.getMinutes());
        var ss = padZero(dt.getSeconds());

        return y + '-' + m + '-' + d + ' ' + hh + ':' + mm + ':' + ss;
    }
    // 补零函数
    function padZero(n){
        return n > 9? n : '0' + n
    }

    initTable(); // 请求文章列表数据并使用模板引擎渲染列表结构
    initCate();

    // 获取文章列表数据的方法
    function initTable (){
        $.ajax({
            type: 'GET',
            url: '/my/article/list',
            data: q,
            success: function(res){
                if(res.status !== 0){
                    return layer.msg( "获取文章列表失败！") 
                }
                // 使用模板引擎渲染页面的数据
                var htmlStr = template('tpl-table', res);
                $('tbody').html(htmlStr);

                // 渲染文章列表分页
                renderPage(res.total);
            }
        })
    }

    // 初始化文章分类的方法: 请求文章分类的列表数据 
    function initCate(){
        $.ajax({
            method: 'GET',
            url: '/my/article/cates',
            success: function(res){
                if(res.status !== 0){
                    return layer.msg('获取文章分类列表失败！')
                }
                // 调用模板引擎渲染分类的可选项
                var htmlStr = template('tpl-cate', res);
                $('[name="cate_id"]').html(htmlStr);
                // 通过 layui 重新渲染表单区域的UI结构
                form.render();
            }
        })
    }

    // 为筛选表单添加提交事件
    $('#form-search').on('submit', function(e){
        e.preventDefault();
        // 获取表单中选中项的值
        var cate_id = $('[name="cate_id"]').val();
        var state = $('[name="state"]').val();
         // 为查询参数对象 q 中对应的属性赋值
        q.cate_id = cate_id;
        q.state = state;
        // 根据最新的筛选条件，重新渲染表格的数据
        initTable();
    })

    // 定义渲染分页的方法
    function renderPage(total){
        // 调用 layui.laypage.render() :渲染分页的基本结构
        laypage.render({
            elem: 'pageBox', // 分页容器的 Id
            count: total, // 总数据条数
            limit: q.pagesize, // 每页显示几条数据
            curr: q.pagenum, // 设置默认被选中的分页
            layout: ['count', 'limit', 'prev', 'page', 'next', 'skip'],
            limits: [2, 3, 5, 10], // 为每页选择数据条数下拉框预设值
            /* jump 回调函数的两种触发方式：
                1. 点击页码的时候，会触发 jump 回调
                2. 只要调用了 laypage.render() 方法，就会触发 jump 回调

                jump 回调函数的两个参数
                 1. obj: obj包含了当前分页的所有参数
                 2. first: 
                    ① 当 点击分页 触发jump回调时，first的值为undefined
                    ② 当 laypage.render() 触发jump回调时，first的值为 true
            */
            jump: function(obj, first){
                // 把最新的页码值，赋值到 q 这个查询参数对象中
                q.pagenum = obj.curr;

                // 把最新的条目数，赋值到 q 这个查询参数对象的 pagesize 属性中
                q.pagesize = obj.limit;

                // 触发死循环
                // initTable()

                // 避免死循环
                if(first !== true){
                    initTable();
                }
            }
        })
    }

    // 通过代理的形式，为删除按钮绑定点击事件处理函数, 并实现删除文章的功能
    $('tbody').on('click', '.btn-delete',function(){
        // 获取删除按钮的个数
        var len = $('.btn-delete').length;
        // 获取到文章的 id
        var id = $(this).attr('data-id');
        // 询问用户是否要删除数据
        layer.confirm('确认删除?', {icon: 3, title:'提示'}, function(index){
            $.ajax({
                method: 'GET',
                url: '/my/article/delete/'+ id,
                success: function(res){
                    if(res.status !== 0){
                        return layer.msg('删除文章失败！');
                    }
                    layer.msg('删除文章成功！');
                    /* 当删除文章之后，需要判断当前这一页中，是否还有剩余的数据，如果没有剩余的数据了,则让页码值 -1 之后,再重新调用 initTable 方法

                    若直接调用 initTable，页码值没有随着删除文章而改变，可能造成文章列表读取不出来
                    */ 
                    
                    // 如果 len 的值等于1，证明删除完毕之后，页面上就没有任何数据了
                    if(len == 1){
                         // 页码值最小必须是 1
                        q.pagenum = q.pagenum === 1 ? 1 : q.pagenum - 1;
                    }
                    initTable();
                }
            })
            layer.close(index);
          });
    })

    // 查看文章
    $('tbody').on('click', '.link-detail', function(){
        var id = $(this).attr('data-id');
        $.ajax({
            method: 'GET',
            url: '/my/article/' + id,
            success: function(res){
                if(res.status !== 0){
                    return layer.msg('文章查看失败，请检查网络是否连接!');
                }

            

                var htmlStr = template('tpl-article', res.data);
                layer.open({
                    type: 1,
                    title: '预览文章',
                    area: ['1034px', '600px'],
                    content: htmlStr
                })
            }
        })
    })

    
})