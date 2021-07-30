/**
 * JuST4iT
 * 以 _ 开始表示私有方法跟变量 
 * 非 _ 开始参数及方法 可以外部重载
 * */
var wslib = {
	_ws : null,
	url : null,
	reconnectime : 2000, //重试:间隔时间
	delaysndtime : 2000, //重试:发送延时
	retrysndtime : 3,	 //重试:重发次数
	_retrytmptime : 0,
	_reconnecting : false,
	heartbeattime : 60000,//心跳包重试时间
	heartbeattext : 'default-heartbeat-content', //心跳包内容
	_heartbeatobj1 : null,
	_heartbeatobj2 : null,
	websocket : function(config) {
		this.url = config.url || this.url;
		this.reconnectime = config.reconnectime || this.reconnectime;
		this.heartbeattime = config.heartbeattime || this.heartbeattime;
		this.heartbeattext = config.heartbeattext || this.heartbeattext;
		this.retrysndtime = config.retrysndtime || this.retrysndtime;
		this.open = config.open || this.open;
		this.error = config.error || this.error;
		this.close = config.close || this.close;
		this.message = config.message || this.message;
		this._connect();
	},
	_connect : function() {
		try {
			if (this._ws != null) delete this._ws;
			this._ws = new WebSocket(this.url);
			this._bindevent();
		} catch (e) {
			console.error("WebSocket Connect Error:" + e);
			this._reconnect();
		}
	},
	_reconnect : function() {
		var $this = this;
		if ($this._reconnecting) return;
		$this._reconnecting = true;
		setTimeout(function() {
			$this._connect();
			$this._reconnecting = false;
		}, $this.reconnectime);
	},
	_bindevent : function() {
		var $this = this;
		$this._ws.onclose = function() {
			$this.close();
			$this._reconnect();
		};
		$this._ws.onerror = function() {
			$this.error();
			$this._reconnect();
		};
		$this._ws.onopen = function() {
			$this.open();
			$this._reset()._start();
		};
		$this._ws.onmessage = function(event) {
			$this.message(event);
			$this._reset()._start();
		};
	},
	_reset : function() {
		clearTimeout(this._heartbeatobj1);
		clearTimeout(this._heartbeatobj2);
		return this;
	},
	_start : function() {
		var $this = this;
		$this._heartbeatobj1 = setTimeout(function() {
			$this.sendMessage($this.heartbeattext);
			$this._heartbeatobj2 = setTimeout(function() {
				$this._ws.close();
			}, $this.heartbeattime);
		}, $this.heartbeattime);
	},
	open : function() {
		console.debug("TODO:ON OPEN");
	},
	error : function() {
		console.debug("TODO:ON ERROR");
	},
	close : function() {
		console.debug("TODO:ON CLOSE");
	},
	message : function(event) {
		console.debug("TODO: ON MESSAGE: " + event.data);
	},
	sendMessage : function(message) {
		var $this = this;
		if ($this._ws == null) { alert("websocket 未建立连接!"); return;}
		if ($this._ws.readyState == 1) {
			$this._ws.send(message);
			$this._reset()._start();
			$this._retrytmptime = $this.retrysndtime;
		} else {
			$this._retrytmptime -= 1;
			if ($this._retrytmptime > 0) {
				setTimeout(function() {$this.sendMessage(message); }, $this.delaysndtime);
			}
		}
	}
};

/*调用示例
wslib.websocket({
	url:'<%=ws%>/websocket2/<%=session.getId()%>',
	heartbeattime:5000,
	heartbeattext:'{"heartbeat":"0"}',
	open:function(){
		console.debug("--------open-----");
	}
});

function send(){
	var message = document.getElementById('message').value;
	wslib.sendMessage(message);
}
 */