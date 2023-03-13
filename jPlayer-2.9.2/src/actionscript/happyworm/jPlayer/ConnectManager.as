
package happyworm.jPlayer {
	
	import flash.events.*;
	import flash.net.*;
	
	import flash.utils.Timer;
	import flash.utils.getTimer;
	import flash.utils.clearInterval;
	import flash.utils.setInterval;

	public class ConnectManager extends Object {
		
		private var protocols_arr:Array = new Array("rtmp","rtmpt","rtmpe","rtmpte","rtmps");
		private var ports_arr:Array = new Array("",":1935",":80",":443");
		private const protCount:Number = 5;
		private const portCount:Number = 4;
		
		private var _ncRef:Object;
		
		private var _aNC:Array;

		private var k_TIMEOUT:Number = 30000;
		private var k_startConns:Number;
		private var m_connList:Array = [];
		private var m_serverName:String;
		private var m_appName:String;
		private var m_streamName:String;
		private var m_connListCounter:Number;
		private var m_flashComConnectTimeOut:Number;
		private var m_validNetConnection:NetConnection;
		
		private var connectSuccess:Boolean=false;
		
		private var negotiating:Boolean=false;
		private var idleTimeOut:Boolean=false;

		public function ConnectManager() {
			trace ("ConnectManager Initialized Version: 1.00 DT");
			createPortsProtocolsArray();
		}
		
		private function createPortsProtocolsArray():void {
		var outerLoop:Number=0;
		var innerLoop:Number=0;
			for (outerLoop=0; outerLoop<protocols_arr.length; outerLoop++) {
				
				for (innerLoop=0; innerLoop<ports_arr.length; innerLoop++) {
					m_connList.push( { protocol: protocols_arr[outerLoop], port: ports_arr[innerLoop] } );
				}
				
			}		
		}
		
		public function negotiateConnect(ncRef:Object,p_serverName:String,p_appName:String):void
		{
			negotiating=true;
			_ncRef=ncRef;
			trace("*** SERVER NAME: "+p_serverName);
			trace("*** APP NAME: "+p_serverName);
			k_startConns = getTimer();
			m_serverName = p_serverName;
			m_appName = p_appName;

			clearInterval(m_flashComConnectTimeOut);
			m_flashComConnectTimeOut = setInterval(onFlashComConnectTimeOut,k_TIMEOUT,k_TIMEOUT);

			_aNC = new Array();
			for (var i:uint = 0; i < m_connList.length; i++)
			{
				_aNC[i] = new NetConnection();
				_aNC[i].addEventListener(NetStatusEvent.NET_STATUS,netStatus);
				_aNC[i].addEventListener(SecurityErrorEvent.SECURITY_ERROR,netSecurityError);
				_aNC[i].addEventListener(AsyncErrorEvent.ASYNC_ERROR,asyncError);      
				_aNC[i].client = new Object;
				_aNC[i].client.owner = this;
				_aNC[i].client.connIndex = i;
				_aNC[i].client.id = i;
				_aNC[i].client.pending = true;

				
			}
			m_connListCounter = 0;
			nextConnect ();
		}
		
		private function nextConnect():void
		{
			trace("*** Connection: "+ m_connListCounter + ": "+m_connList[m_connListCounter].protocol + "://" + m_serverName + m_connList[m_connListCounter].port + "/" + m_appName);

			try {
				_aNC[m_connListCounter].connect(m_connList[m_connListCounter].protocol + "://" + m_serverName + m_connList[m_connListCounter].port + "/" + m_appName);

			} catch (error:Error) {
				// statements
				trace("*** Caught an error condition: "+error);
				m_connListCounter = m_connList.length+1;
			}
			// statements
				clearInterval(_aNC["ncInt" + m_connListCounter]);

			if ((m_connListCounter < m_connList.length - 1))
			{
				m_connListCounter++;
				_aNC["ncInt" + m_connListCounter] = setInterval(nextConnect,1500);
			}

		}
		
		// Cleans up all connections if none have succeeded by the timeout interval
		private function onFlashComConnectTimeOut(timeout:Number):void
		{
			stopAll();
		}
		
		private function handleGoodConnect(_nc:NetConnection):void {
			negotiating=false;
			trace("Handing OFF NetConnection");
			clearInterval(m_flashComConnectTimeOut);
			_ncRef.connectStream();
			_ncRef.onBWDone(null,_nc);

		}
		
		public function getNegotiating():Boolean {
			return negotiating;
		}
		
		public function setNegotiating(bool:Boolean):void {
			negotiating=bool;
		}
		
		
		public function stopAll(bool:Boolean=false):void {

			if(_aNC!=null && !isNaN(m_flashComConnectTimeOut) ) {
				clearInterval(m_flashComConnectTimeOut);
			for (var i:uint = 0; i < m_connList.length; i++)
			{
				if (_aNC[i]!=null)
				{
					clearInterval(_aNC["ncInt" + i]);
					_aNC[i].close();
					if(bool==false) {
						_aNC[i].client = null;
					}
					_aNC[i] = null;
					delete _aNC[i];
				}
			}
			}
						
		}
		
		
		private function netStatus(event:NetStatusEvent):void {
			
			trace(event.info.code);
			if(event.info.description != undefined) {
				trace(event.info.description);
			}
			_aNC[event.target.client.id].client.pending = true;
	
				switch (event.info.code) {
					case "NetConnection.Connect.IdleTimeOut":
					trace("IDLE TIMEOUT OCCURRED!")
					negotiating=true;
					idleTimeOut=true;
					_ncRef.shutDownNcNs();
					break;
				case "NetConnection.Connect.Closed":
					if(!negotiating && !idleTimeOut) {
						idleTimeOut = false;
						_ncRef.doneYet();
					}
					break;
				case "NetConnection.Connect.InvalidApp":
				case "NetConnection.Connect.Rejected":
					
    				break;
				case "NetConnection.Call.Failed":
				
					break;
					case "NetConnection.Connect.Success":
						var i:uint=0;
						for ( i = 0; i<_aNC.length; i++) {
						if (_aNC[i] && (i != event.target.client.id)) {
							_aNC[i].close();
							_aNC[i] = null;
						}
					}
					var _nc:NetConnection = NetConnection(event.target);
					var connID:Number = event.target.client.id;
					var _actualPort:String = m_connList[m_connListCounter].port;
					var _actualProtocol:String = m_connList[m_connListCounter].protocol;
															
					// See if we have version info
					var _serverVersion:String = "UNKNOWN";
					if (event.info.data && event.info.data.version) {
						_serverVersion = event.info.data.version;
					}
					trace("Connect ID: "+connID+" - PORT: "+_actualPort+" - PROTOCOL: "+_actualProtocol+" - FMS Version: "+_serverVersion);
					
					clearInterval(_aNC["ncInt" + connID]);
					clearInterval(_aNC["ncInt" + m_connListCounter]);

					handleGoodConnect(_nc);
					break;
				}
		}

		private function netSecurityError(event:SecurityErrorEvent):void {
			trace("SECURITY ERROR:"+event);
			
    	}

		private function asyncError(event:AsyncErrorEvent):void {
			trace("ASYNC ERROR:"+event.error);
    	}
		
		

	}
	
}
