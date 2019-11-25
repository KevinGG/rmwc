import { ListProps, ListApi } from './list';
import { matches, FoundationElement } from '@rmwc/base';
import { useFoundation } from '@rmwc/base';
import { MDCListFoundation } from '@material/list';
import { useEffect, useCallback } from 'react';

export const useListFoundation = (props: ListProps & React.HTMLProps<any>) => {
  const listElements = useCallback((el: Element | null): HTMLLIElement[] => {
    if (el) {
      return [].slice.call(
        el.querySelectorAll(`.${MDCListFoundation.cssClasses.LIST_ITEM_CLASS}`)
      );
    }
    return [];
  }, []);

  const { foundation, ...elements } = useFoundation({
    props,
    api: ({ rootEl }: { rootEl: FoundationElement<any, any> }): ListApi => {
      return {
        listElements: () => listElements(rootEl.ref),
        focusRoot: () => rootEl.ref && rootEl.ref.focus(),
        getClasses: () => MDCListFoundation.cssClasses.LIST_ITEM_CLASS
      };
    },
    elements: { rootEl: true },
    foundation: ({ rootEl, emit }) => {
      return new MDCListFoundation({
        getListItemCount: () => listElements(rootEl.ref).length,
        getFocusedElementIndex: () =>
          listElements(rootEl.ref).indexOf(
            document.activeElement as HTMLLIElement
          ),
        listItemAtIndexHasClass: (index: number, className: string) => {
          const element = listElements(rootEl.ref)[index];
          return !!element?.classList.contains(className);
        },
        setAttributeForElementIndex: (
          index: number,
          attr: string,
          value: string | number
        ) => {
          // This value is getting set and never getting set back
          // This is causing list items to be un-tabbable
          if (attr === 'tabindex' && value === -1) {
            return;
          }

          const element = listElements(rootEl.ref)[index];
          if (element) {
            element.setAttribute(attr, String(value));
          }
        },
        addClassForElementIndex: (index: number, className: string) => {
          const element = listElements(rootEl.ref)[index];
          if (element) {
            element.classList.add(className);
          }
        },
        removeClassForElementIndex: (index: number, className: string) => {
          const element = listElements(rootEl.ref)[index];
          if (element) {
            element.classList.remove(className);
          }
        },
        focusItemAtIndex: (index: number) => {
          const element = listElements(rootEl.ref)[index];
          if (element) {
            element.focus();
          }
        },
        setTabIndexForListItemChildren: (
          listItemIndex: number,
          tabIndexValue: string | number
        ) => {
          const element = listElements(rootEl.ref)[listItemIndex];
          const listItemChildren: Element[] = [].slice.call(
            element.querySelectorAll(
              MDCListFoundation.strings.CHILD_ELEMENTS_TO_TOGGLE_TABINDEX
            )
          );
          listItemChildren.forEach(ele =>
            ele.setAttribute('tabindex', String(tabIndexValue))
          );
        },
        hasCheckboxAtIndex: (index: number) => {
          const listItem = listElements(rootEl.ref)[index];
          return !!listItem.querySelector(
            MDCListFoundation.strings.CHECKBOX_SELECTOR
          );
        },
        hasRadioAtIndex: (index: number) => {
          const listItem = listElements(rootEl.ref)[index];
          return !!listItem.querySelector(
            MDCListFoundation.strings.RADIO_SELECTOR
          );
        },
        isCheckboxCheckedAtIndex: (index: number) => {
          const listItem = listElements(rootEl.ref)[index];
          const toggleEl = listItem.querySelector(
            MDCListFoundation.strings.CHECKBOX_SELECTOR
          ) as HTMLInputElement | null;

          return toggleEl ? toggleEl.checked : false;
        },
        setCheckedCheckboxOrRadioAtIndex: (
          index: number,
          isChecked: boolean
        ) => {
          const listItem = listElements(rootEl.ref)[index];
          const toggleEl = listItem.querySelector(
            MDCListFoundation.strings.CHECKBOX_RADIO_SELECTOR
          ) as HTMLInputElement | null;

          if (toggleEl) {
            toggleEl.checked = isChecked;

            const event = document.createEvent('Event');
            event.initEvent('change', true, true);
            toggleEl.dispatchEvent(event);
          }
        },
        notifyAction: (index: number) => {
          emit('onAction', index);
        },
        isFocusInsideList: () => {
          return !!rootEl.ref?.contains(document.activeElement);
        }
      });
    }
  });

  const { rootEl } = elements;

  /**
   * Used to figure out which list item this event is targetting. Or returns -1 if
   * there is no list item
   */
  const getListItemIndex = useCallback(
    (evt: React.FocusEvent | React.KeyboardEvent | React.MouseEvent) => {
      let eventTarget = evt.target as HTMLElement | null;
      let index = -1;

      // Find the first ancestor that is a list item or the list.
      while (
        eventTarget &&
        !eventTarget.classList.contains(
          MDCListFoundation.cssClasses.LIST_ITEM_CLASS
        ) &&
        !eventTarget.classList.contains(MDCListFoundation.cssClasses.ROOT)
      ) {
        eventTarget = eventTarget.parentElement as HTMLLIElement;
      }

      // Get the index of the element if it is a list item.
      if (
        eventTarget &&
        eventTarget.classList.contains(
          MDCListFoundation.cssClasses.LIST_ITEM_CLASS
        )
      ) {
        index = listElements(rootEl.ref).indexOf(eventTarget as HTMLLIElement);
      }

      return index;
    },
    [listElements, rootEl.ref]
  );

  const handleClick = useCallback(
    (evt: React.MouseEvent) => {
      props.onClick?.(evt);

      const index = getListItemIndex(evt);

      // Toggle the checkbox only if it's not the target of the event, or the checkbox will have 2 change events.
      const toggleCheckbox = !matches(
        evt.target as HTMLElement,
        MDCListFoundation.strings.CHECKBOX_RADIO_SELECTOR
      );

      foundation.handleClick(index, toggleCheckbox);
    },
    [getListItemIndex, foundation, props.onClick]
  );

  const handleKeydown = useCallback(
    (evt: React.KeyboardEvent<HTMLElement> & KeyboardEvent) => {
      props.onKeyDown?.(evt);

      const index = getListItemIndex(evt);

      if (index >= 0) {
        foundation.handleKeydown(
          evt,
          evt.target instanceof Element &&
            evt.target.classList.contains(
              MDCListFoundation.cssClasses.LIST_ITEM_CLASS
            ),
          index
        );
      }
    },
    [getListItemIndex, foundation, props.onKeyDown]
  );

  const handleFocusIn = useCallback(
    (evt: React.FocusEvent & FocusEvent) => {
      props.onFocus?.(evt);
      foundation.handleFocusIn(evt, getListItemIndex(evt));
    },
    [getListItemIndex, foundation, props.onFocus]
  );

  const handleFocusOut = useCallback(
    (evt: React.FocusEvent & FocusEvent) => {
      props.onBlur?.(evt);
      foundation.handleFocusOut(evt, getListItemIndex(evt));
    },
    [getListItemIndex, foundation, props.onBlur]
  );

  rootEl.setProp('onClick', handleClick, true);
  rootEl.setProp('onKeyDown', handleKeydown, true);
  rootEl.setProp('onFocus', handleFocusIn, true);
  rootEl.setProp('onBlur', handleFocusOut, true);

  // layout on mount
  useEffect(() => {
    foundation.layout();
  }, [foundation]);

  return { ...elements };
};
