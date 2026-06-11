export interface CalculatorComponent {
  type: string;
  label: string;
}

export interface CalculatorStore {
  components: CalculatorComponent[];
  darkMode: boolean;
  addComponent: (component: CalculatorComponent) => void;
  removeComponent: (index: number) => void;
  clearComponents: () => void;
  toggleDarkMode: () => void;
}
