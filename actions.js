module.exports = {

	/**
	* Get the available actions.
	*
	* @returns {Object[]} the available actions
	* @access public
	* @since 1.1.0
	*/

	getActions() {
		var actions = {};
		actions['go'] = { label: 'Go Take Preview to Live'},
		actions['tr'] = { label: 'Toggle Record'},
		actions['tb'] = { label: 'Toggle Broadcast'},
		actions['startr'] = { label: 'Start Recording'},
		actions['stopr'] = { label: 'Stop Recording'},
		actions['startb'] = { label: 'Start Broadcast'},
		actions['stopb'] = { label: 'Stop Broadcast'},
		actions['transindx'] = {
			label: 'Change Transition',
			options: [{
					type: 'dropdown',
					label: 'Display mode',
					id: 'transIndx',
					default: '1',
					choices: [
						{ id: '1', label: 'Left'},
						{ id: '2', label: 'Right'}
					]
			}]
		},
		actions['selectshot'] = {
			label: 'Select Shot With Layer and Index',
			options: [{
				type: 'dropdown',
				label: 'Layer',
				id: 'layer',
				default: '1',
				choices: [
					{ id: '1', label: '1'},
					{ id: '2', label: '2'},
					{ id: '3', label: '3'},
					{ id: '4', label: '4'},
					{ id: '5', label: '5'}
				]
			},
			
				{
					type: 'textinput',
					label: 'Shot Index',
					id: 'sindex',
					default: '1',
					regex: '/-?([0-9])/'
				}
			
		]
		}
		return actions;
	}
}
