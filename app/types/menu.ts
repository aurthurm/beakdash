export interface ImenuItem {
    label: string,
    route?: string,
    icon?: any,
    active?: boolean,
    submenu?: ImenuItem[]
}

export interface MenuState {
  items: ImenuItem[]
  bottomItems: ImenuItem[]
  setActive: (item: ImenuItem, submenu?: ImenuItem, bottom?: boolean) => void
  addMenu: (item : ImenuItem) => void
  addSubMenu: (item: ImenuItem, submenu : ImenuItem) => void
}
