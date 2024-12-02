export interface ImenuItem {
    label: string,
    icon?: any,
    active?: boolean,
    submenu?: ImenuItem[]
}

export interface MenuState {
  items: ImenuItem[]
  setActive: (item: ImenuItem, submenu?: ImenuItem) => void
  addMenu: (item : ImenuItem) => void
  addSubMenu: (item: ImenuItem, submenu : ImenuItem) => void
}
