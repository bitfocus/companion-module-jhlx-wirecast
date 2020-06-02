module.exports = {

		/**
		* Get the available feedbacks.
		*
		* @returns {Object[]} the available feedbacks
		* @access public
		* @since 1.1.0
		*/

		getFeedbacks() {
			var feedbacks = {}

			feedbacks['shot_status'] = {
				label: 'Change color from if shot is in preview or program',
				description: 'Change the colors of a bank according to the shot state',
				options: [
					{
						type: 'colorpicker',
						label: 'Preview: Foreground color',
						id: 'pre_fg',
						default: this.rgb(255,255,255)
					},
					{
						type: 'colorpicker',
						label: 'Preview: Background color',
						id: 'pre_bg',
						default: this.rgb(0,255,0)
					},
					{
						type: 'colorpicker',
						label: 'Program: Foreground color',
						id: 'pro_fg',
						default: this.rgb(255,255,255)
					},
					{
						type: 'colorpicker',
						label: 'Program: Background color',
						id: 'pro_bg',
						default: this.rgb(255,0,0)
					},
					{
						type: 'textinput',
					id: 'masterid',
					label: 'Master Layer',
					width: 6
				},
				{type: 'textinput',
				id: 'shotid',
				label: 'Shot Index',
				width: 6
			}
				],
				callback: (feedback, bank) => {
					if (this.feedbackstate.program[feedback.options.masterid] == feedback.options.shotid) {
						return {
							color: feedback.options.pro_fg,
							bgcolor: feedback.options.pro_bg
						};
					}
					else if (this.feedbackstate.preview[feedback.options.masterid] == feedback.options.shotid) {
						return {
							color: feedback.options.pre_fg,
							bgcolor: feedback.options.pre_bg
						}
					}
				}
			},
			feedbacks['isrecording'] = {
				label: 'Change color For Recording or Broadcasting',
				description: 'Change the colors of a bank according to the current Recording/broadcasting Status',
				options: [
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'mode',
						choices: [
							{ id: 'RECORD', label: 'Recording'},
							{ id: 'BROADCAST', label: 'Broadcasting'}
						],
						default: 'RECORD'
					},
					{
						type: 'colorpicker',
						label: 'Foreground color',
						id: 'fg',
						default: this.rgb(255,255,255)
					},
					{
						type: 'colorpicker',
						label: 'Background color',
						id: 'bg',
						default: this.rgb(255,0,0)
					}
				],
				callback: (feedback, bank) => {
						if (this.feedbackstate.isrecording == 'True'  && feedback.options.mode == 'RECORD') {
							
							return {
								color: feedback.options.fg,
								bgcolor: feedback.options.bg
							};
						}else if (this.feedbackstate.isbroadcasting == 'True' && feedback.options.mode == 'BROADCAST') {
							return {
								color: feedback.options.fg,
								bgcolor: feedback.options.bg
							};
						}
				}
			},

			feedbacks['transIndx'] = {
				label: 'Change color For Transition Selection',
				description: 'Change the colors of a bank according to the current Recording/broadcasting Status',
				options: [
					{
						type: 'dropdown',
						label: 'Transition Index Button',
						id: 'transIndx',
						choices: [
							{ id: '0', label: 'Left'},
							{ id: '1', label: 'Right'}
						],
						default: '0'
					},
					{
						type: 'colorpicker',
						label: 'Foreground color',
						id: 'fg',
						default: this.rgb(0,0,0)
					},
					{
						type: 'colorpicker',
						label: 'Background color',
						id: 'bg',
						default: this.rgb(100,100,100)
					}
				],
				callback: (feedback, bank) => {
					
						if (this.feedbackstate.transIndx == feedback.options.transIndx) {
							return {
								color: feedback.options.fg,
								bgcolor: feedback.options.bg
							};
						}
				}
			},

			feedbacks['message_on'] = {
				label: 'Change color when message is active',
				description: 'Change the colors of a bank according when message is active',
				options: [
					{
						type: 'colorpicker',
						label: 'Foreground color',
						id: 'run_fg',
						default: this.rgb(255,255,255)
					},
					{
						type: 'colorpicker',
						label: 'Background color',
						id: 'run_bg',
						default: this.rgb(255,0,0)
					}
				],
				callback: (feedback, bank) => {
					if (this.feedbackstate.message == 'TRUE') {
						return {
							color: feedback.options.run_fg,
							bgcolor: feedback.options.run_bg
						};
					}
				}
			}

			return feedbacks;
		}
}
