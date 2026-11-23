/** Deriv Bot–style Blockly themes (light + dark). */
import * as Blockly from 'blockly';

function makeTheme(name: string, dark: boolean): Blockly.Theme {
  const blockStyles = {
    trade_blocks: { colourPrimary: '#CC2E39' },
    purchase_blocks: { colourPrimary: '#22A45D' },
    sell_blocks: { colourPrimary: '#2C9C8F' },
    restart_blocks: { colourPrimary: '#785E93' },
    analysis_blocks: { colourPrimary: '#4A76A8' },
    indicator_blocks: { colourPrimary: '#2B6CB0' },
    utility_blocks: { colourPrimary: '#64748B' },
    math_blocks: { colourPrimary: '#5C81A6' },
    logic_blocks: { colourPrimary: '#5CA65C' },
    loop_blocks: { colourPrimary: '#5CA65C' },
    text_blocks: { colourPrimary: '#5CA65C' },
    list_blocks: { colourPrimary: '#745BA5' },
    variable_blocks: { colourPrimary: '#B18CD1' },
    procedure_blocks: { colourPrimary: '#785E93' },
  };

  const categoryStyles = {
    trade_category: { colour: '#CC2E39' },
    purchase_category: { colour: '#22A45D' },
    sell_category: { colour: '#2C9C8F' },
    restart_category: { colour: '#785E93' },
    analysis_category: { colour: '#4A76A8' },
    utility_category: { colour: '#64748B' },
    logic_category: { colour: '#5CA65C' },
    loop_category: { colour: '#5CA65C' },
    math_category: { colour: '#5C81A6' },
    text_category: { colour: '#5CA65C' },
    list_category: { colour: '#745BA5' },
    variable_category: { colour: '#B18CD1' },
    procedure_category: { colour: '#785E93' },
  };

  const componentStyles = {
    workspaceBackground: dark ? '#14181B' : '#FAFBFC',
    toolboxBackground: dark ? '#1A1A1A' : '#FFFFFF',
    flyoutBackground: dark ? '#222222' : '#F8F9FA',
    scrollbarColour: dark ? '#4A5257' : '#C9CFD4',
    insertionMarkerColour: '#FF444F',
    insertionMarkerOpacity: 0.35,
    scrollbarOpacity: 0.6,
    cursorColour: '#FF444F',
  };

  return new Blockly.Theme(name, blockStyles, categoryStyles, componentStyles);
}

export const derivLightTheme = makeTheme('deriv-light', false);
export const derivDarkTheme = makeTheme('deriv-dark', true);
