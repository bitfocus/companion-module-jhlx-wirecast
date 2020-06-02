var tcp           = require('../../tcp');
var instance_skel = require('../../instance_skel');
var actions       = require('./actions');
var feedback      = require('./feedback');
var presets       = require('./presets');

var debug;
var log;
var lineEndings;

class instance extends instance_skel {
	/**
	* Create an instance.
	*
	* @param {EventEmitter} system - the brains of the operation
	* @param {string} id - the instance ID
	* @param {Object} config - saved user configuration parameters
	* @since 1.1.0
	*/
	constructor(system, id, config) {
		super(system, id, config);

		Object.assign(this, {...actions,...feedback,...presets});

		this.lineEndings = '';
		this.preview = {
			'0': '0'
		};
		this.program = {
			'0': '0'
		};
		this.feedbackstate = {
			isrecording: 'False',
			isbroadcasting: 'False',
			transIndx: '0',
			preview: this.preview,
			program: this.program,
		};
		this.log;

		this.actions(); // export actions

	}
	/**
	 * Setup the actions.
	 *
	 * @param {EventEmitter} system - the brains of the operation
	 * @access public
	 * @since 1.1.0
	 */
	actions(system) {
		this.setActions(this.getActions());
	}
	/**
	 * Creates the configuration fields for web config.
	 *
	 * @returns {Array} the config fields
	 * @access public
	 * @since 1.1.0
	 */
	config_fields() {

		return [
			{
				type: 'text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This Module Controls JHLX\'s Wirecast Plugin'
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				width: 6,
				regex: this.REGEX_IP
			},
			{
				type: 'text',
				id: 'info',
				width: 6,
				label: 'Feedback',
				value: 'This module has support for getting information about Wirecast and Send Contol to it'
			}
		]
	}
	/**
	 * Executes the provided action.
	 *
	 * @param {Object} action - the action to be executed
	 * @access public
	 * @since 1.0.0
	 */
	action(action) {
		var id = action.action;
		var cmd;
		var opt = action.options;

		switch (id){

			case 'go':
				cmd = 'GO';
				break;

			case 'tr':
				cmd = 'TR' ;
				break;

			case 'tb':
				cmd = 'TB' ;
				break;

			case 'startr':
				cmd = 'STARTR' ;
				break;	
		
			case 'startb':
				cmd = 'STARTB' ;
				break;
				
			case 'stopr':
				cmd = 'STOPR' ;
				break;

			case 'stopb':
				cmd = 'STOPR' ;
				break;
			
			case 'transindx':
				cmd = 'TRANSINDX=' + opt.transIndx;
				break;

			case 'selectshot':
				cmd = 'SHOT=' + opt.layer + '&' +opt.sindex;
				break;

		}

		if (cmd !== undefined) {
			debug('sending ', cmd, "to", this.config.host);
			if (this.currentStatus != this.STATUS_OK) {
				this.init_tcp(function() {
					this.socket.send(cmd + this.lineEndings);
				});
			} else {
				this.socket.send(cmd + this.lineEndings);
			}
		}
	}
	/**
	 * Clean up the instance before it is destroyed.
	 *
	 * @access public
	 * @since 1.1.0
	 */
	destroy() {

		if (this.timer) {
			clearInterval(this.timer);
			delete this.timer;
		}

		if (this.socket !== undefined) {
			this.socket.destroy();
		}
		debug("destroy", this.id);
	}
	/**
	 * Main initialization function called once the module
	 * is OK to start doing things.
	 *
	 * @access public
	 * @since 1.1.0
	 */
	init() {
		debug = this.debug;
		log = this.log;

		this.initPresets();
		this.init_tcp();
	}
	/**
	 * INTERNAL: use setup data to initalize the tcp socket object.
	 *
	 * @access protected
	 * @since 1.0.0
	 */
	init_tcp() {
		if (this.socket !== undefined) {
			this.socket.destroy();
			delete this.socket;
		}

		if (this.config.host) {
			this.socket = new tcp(this.config.host, 23, { reconnect: true });

			this.socket.on('status_change', (status, message) => {
				this.status(status, message);
			});

			this.socket.on('error', (err) => {
				this.debug("Network error", err);
				this.log('error',"Network error: " + err.message);
			});

			this.socket.on('connect', () => {
				this.debug("Connected");

				this.status(2,'Initializing');
				this.socket.send("welcome");
				this.socket.receivebuffer = '';
				
				this.status(this.STATUS_OK);
			});

			// separate buffered stream into lines with responses
			this.socket.on('data', (chunk) => {
				var i = 0, line = '', offset = 0;

				this.socket.receivebuffer += chunk;

				while ( (i = this.socket.receivebuffer.indexOf('\r\n', offset)) !== -1) {
					line = this.socket.receivebuffer.substr(offset, i - offset);
					offset = i + 2;
					this.socket.emit('receiveline', line.toString());
				}
				this.socket.receivebuffer = this.socket.receivebuffer.substr(offset);
			});

			this.socket.on('receiveline', (data) => {
				
				//this.log('debug', data.toString());
				var info = data.toString().split(/ /);

					if (info[0].match("Wirecast")) {
						this.log('debug', 'Connected to wirecast');

						this.initFeedbacks();
						this.initVariables();
						this.checkFeedbacks('shot_status');
						this.checkFeedbacks('transIndx');
						this.checkFeedbacks('isrecording');
						this.checkFeedbacks('isbroadcasting');
						this.updateState();
						this.updateLayer();
						

						// Include feedback variables
						this.initPresets(true);
					}
				

					if (info[0].match("MESSAGE")) {
						var feedbackFromSoftware = info[1].split("&");
						var feedbackval;
						for (feedbackval of feedbackFromSoftware)
						{
						this.updateFeedback(feedbackval);
						}
					}

			});

			this.socket.on('end', () => {
				debug('Disconnected, ok');
				this.socket.destroy();
				delete this.socket;
			});
		}
	}
	/**
	 * INTERNAL: initialize feedbacks.
	 *
	 * @access protected
	 * @since 1.1.0
	 */
	initFeedbacks() {
		// feedbacks
		var feedbacks = this.getFeedbacks();

		this.setFeedbackDefinitions(feedbacks);
	}
	/**
	 * INTERNAL: initialize presets.
	 *
	 * @access protected
	 * @since 1.1.0
	 */
	initPresets (updates) {
		var presets = this.getPresets(updates);

		this.setPresetDefinitions(presets);
	}
	/**
	 * Process an updated configuration array.
	 *
	 * @param {Object} config - the new configuration
	 * @access public
	 * @since 1.1.0
	 */
	updateConfig (config) {
		var resetConnection = false;

		if (this.config.host != config.host)
		{
			resetConnection = true;
		}

		this.config = config;
		this.initPresets();
		if (resetConnection === true || this.socket === undefined) {
			this.init_tcp();
		}
	}
	/**
	 * INTERNAL: initialize variables.
	 *
	 * @access protected
	 * @since 1.1.0
	 */
	initVariables() {

		var variables = [
			
		];

		this.setVariableDefinitions(variables);
	}


	updateFeedback(val)
	{
		if (val.match("TransitionIndex")) {
			
			var state = val.slice(val.indexOf("=")+1);
				if (this.feedbackstate.transIndx != state) 
				{
					
					this.feedbackstate.transIndx = state;
					this.updateState();
					this.checkFeedbacks('transIndx');
				}
			}else if (val.match("isrecording")) {
				var state = val.slice(val.indexOf("=")+1);
					if (this.feedbackstate.isrecording != state) 
					{
						this.feedbackstate.isrecording = state;
						this.updateState();
						this.checkFeedbacks('isrecording');
					}
				}else if (val.match("isbroadcasting")) {
				var state = val.slice(val.indexOf("=")+1);
					if (this.feedbackstate.isbroadcasting != state) 
					{
						this.feedbackstate.isbroadcasting = state;
						this.updateState();
						this.checkFeedbacks('isrecording');
					}
				}else if (val.match("pindx")) {
				var layer = val.charAt(5);
				var state = val.slice(val.indexOf("=")+1);
					if (this.feedbackstate.preview[layer] != state) 
					{
						this.feedbackstate.preview[layer] = state;
						this.checkFeedbacks('shot_status');
						this.updateLayer();
					}
				}else if (val.match("lindx")) {
					var layer = val.charAt(5);
					var state = val.slice(val.indexOf("=")+1);
						if (this.feedbackstate.program[layer] != state) 
						{
							this.feedbackstate.program[layer] = state;
							this.checkFeedbacks('shot_status');
							this.updateLayer();
						}
					}

	}
	updateState() {
		if(this.feedbackstate.isrecording == 'True')
		{
		
			this.setVariable('isrecording', "Stop Record");
		}else {
		
			this.setVariable('isrecording', "Start Record");
		}if(this.feedbackstate.isbroadcasting == 'True')
		{
		
			this.setVariable('isbroadcasting', "Stop Broadcast");
		}else {
		
			this.setVariable('isbroadcasting', "Start Broadcast");
		}
		
	}

	updateMode() {
		this.setVariable('mode', this.feedbackstate.mode);
	}
	updateLayer() {
		this.setVariable('program', this.feedbackstate.program);
		this.setVariable('preview', this.feedbackstate.preview);
	}

}

exports = module.exports = instance;
