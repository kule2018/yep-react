import * as React from 'react';
import classNames from 'classnames';
export interface PickerProps {
  prefixCls:string;
  className?:string;
  style?:any;
  selectedValue?:[];
  defaultSelectedValue?:[];
  onScrollChange?:(value:any) => void;
  onValueChange?:(value:any) => void;
  children:React.ReactNode;
  noAnimate?:boolean;
  disabled:boolean;
  indicatorStyle?:React.CSSProperties;
  itemStyle?:React.CSSProperties;
}

const Item: React.FunctionComponent<ItemProps> = () => null;

export interface ItemProps  {
  className?: string;
  value?: any;
};
class Picker extends React.Component<PickerProps,any> {

  static Item=Item;

  static defaultProps = {
    prefixCls: 'Yep-picker',
    disabled:false,
  };

  scrollHandlers = (() => {
    let scrollY = -1;
    let lastY = 0;
    let startY = 0;
    let scrollDisabled = false;
    let isMoving = false;

    const setTransform = (nodeStyle:any, value:any) => {
      nodeStyle.transform = value;
      nodeStyle.WebkitTransform = value;
    };

    const setTransition = (nodeStyle:any, value:any) => {
      nodeStyle.transition = value;
      nodeStyle.WebkitTransition = value;
    };

    const scrollTo = (_x:number, y:number, time = 0.3) => {
      if (scrollY !== y) {
        scrollY = y;
        if (time) {
          setTransition(this.contentRef.style, `cubic-bezier(0,0,0.2,1.15) ${time}s`);
        }
        setTransform(this.contentRef.style, `translate3d(0,${-y}px,0)`);
        setTimeout(() => {
          this.scrollingComplete();
          if (this.contentRef) {
            setTransition(this.contentRef.style, '');
          }
        }, +time * 1000);
      }
    };
    //速度计
    const Velocity = ((minInterval = 30, maxInterval = 100) => {
      let _time = 0;
      let _y = 0;
      let _velocity = 0;
      const recorder = {
        record: (y:number) => {
          const now = +new Date();
          _velocity = (y - _y) / (now - _time);
          if (now - _time >= minInterval) {
            _velocity = now - _time <= maxInterval ? _velocity : 0;
            _y = y;
            _time = now;
          }
        },
        getVelocity: (y:number) => {
          if (y !== _y) {
            recorder.record(y);
          }
          return _velocity;
        },
      };
      return recorder;
    })();

    const onStart = (y:number) => {
      if (scrollDisabled) {
        return;
      }
      isMoving = true;
      startY = y;
      lastY = scrollY;
    };

    const onMove = (y:number) => {
      if (scrollDisabled || !isMoving) {
        return;
      }
      scrollY = lastY - y + startY;
      Velocity.record(y);
      this.onScrollChange();
      setTransform(this.contentRef.style, `translate3d(0,${-scrollY}px,0)`);
    };

    const onFinish = () => {
      isMoving = false;
      let targetY = scrollY;
      const height = (React.Children.count(this.props.children) - 1) * this.itemHeight;

      let time = 0.3;

      //const velocity = Velocity.getVelocity(targetY) * 4;
      //if (velocity) {
      //targetY = velocity * 40 + targetY;
      //time = Math.abs(velocity) * .1;
      //}
      if (targetY % this.itemHeight !== 0) {
        targetY = Math.round(targetY / this.itemHeight) * this.itemHeight;
      }
      if (targetY < 0) {
        targetY = 0;
      } else if (targetY > height) {
        targetY = height;
      }
      scrollTo(0, targetY, time < 0.3 ? 0.3 : time);

      this.onScrollChange();
    };

    return {
      touchstart: (evt:any) => onStart(evt.touches[0].screenY),
      mousedown: (evt:any) => onStart(evt.screenY),
      touchmove: (evt:any) => {
        evt.preventDefault();
        onMove(evt.touches[0].screenY);
      },
      mousemove: (evt:any) => {
        evt.preventDefault();
        onMove(evt.screenY);
      },
      touchend: () => onFinish(),
      touchcancel: () => onFinish(),
      mouseup: () => onFinish(),
      getValue: () => {
        return scrollY;
      },
      scrollTo: scrollTo,
      setDisabled: (disabled:boolean) => {
        scrollDisabled = disabled;
      },
    };
  })();

  constructor(props:PickerProps) {
    super(props);
    this.createRootRef = this.createRootRef.bind(this);
    this.createMaskRef = this.createMaskRef.bind(this);
    this.createIndicatorRef = this.createIndicatorRef.bind(this);
    this.createContentRef = this.createContentRef.bind(this);
    this.passiveSupported = this.passiveSupported.bind(this);
    this.onScrollChange = this.onScrollChange.bind(this);
    this.scrollingComplete = this.scrollingComplete.bind(this);
    this.fireValueChange = this.fireValueChange.bind(this);
    this.scrollTo = this.scrollTo.bind(this);
    this.scrollToWithoutAnimation = this.scrollToWithoutAnimation.bind(this);
    this.select = this.select.bind(this);
    this.selectByIndex = this.selectByIndex.bind(this);
    this.doScrollingComplete = this.doScrollingComplete.bind(this);
    this.computeChildIndex = this.computeChildIndex.bind(this);
    let selectedValueState;
    const {selectedValue, defaultSelectedValue} = props;
    if (selectedValue !== undefined) {
      selectedValueState = selectedValue;
    } else if (defaultSelectedValue !== undefined) {
      selectedValueState = defaultSelectedValue;
    } else {
      const children = React.Children.toArray(this.props.children);
      // @ts-ignore
      selectedValueState = children && children[0] && children[0].props.value;
    }
    this.state = {
      selectedValue: selectedValueState,
    };
  }
  itemHeight:number;
  scrollValue:number;
  rootRef:HTMLDivElement;
  contentRef:HTMLDivElement;
  maskRef:HTMLDivElement;
  indicatorRef:HTMLDivElement;

  createRootRef(el:HTMLDivElement) {
    this.rootRef = el;
  }

  createMaskRef(el:HTMLDivElement) {
    this.maskRef = el;
  }

  createIndicatorRef(el:HTMLDivElement) {
    this.indicatorRef = el;
  }

  createContentRef(el:HTMLDivElement) {
    this.contentRef = el;
  }

  passiveSupported() {
    let passiveSupported = false;

    try {
      const options = Object.defineProperty({}, 'passive', {
        get: () => {
          passiveSupported = true;
        },
      });
      window.addEventListener('test', () => {}, options);
    } catch (err) {}
    return passiveSupported;
  }

  onScrollChange() {
    const {children, onScrollChange } = this.props;
    const top = this.scrollHandlers.getValue();
    if (top >= 0) {
      const index = this.computeChildIndex(top, this.itemHeight, React.Children.count(children));
      if (this.scrollValue !== index) {
        this.scrollValue = index;
        // @ts-ignore
        const child = children[index];
        if (child && onScrollChange) {
          onScrollChange(child.props.value);
        } else if (!child && console.warn) {
          console.warn('child not found', children, index);
        }
      }
    }
  }

  fireValueChange(selectedValue:any) {
    if (selectedValue !== this.state.selectedValue) {
      if (!('selectedValue' in this.props)) {
        this.setState({
          selectedValue,
        });
      }
      if (this.props.onValueChange) {
        this.props.onValueChange(selectedValue);
      }
    }
  }

  scrollingComplete() {
    const top = this.scrollHandlers.getValue();
    if (top >= 0) {
      this.doScrollingComplete(top, this.itemHeight, this.fireValueChange);
    }
  }

  scrollTo(top:number) {
    this.scrollHandlers.scrollTo(0, top);
  }

  scrollToWithoutAnimation(top:number) {
    this.scrollHandlers.scrollTo(0, top, 0);
  }

  componentDidMount() {
    const {rootRef, maskRef, indicatorRef, contentRef} = this;

    const rootHeight = rootRef.getBoundingClientRect().height;
    const itemHeight = (this.itemHeight = indicatorRef.getBoundingClientRect().height);

    let itemNum = Math.floor(rootHeight / itemHeight);
    if (itemNum % 2 === 0) {
      itemNum--;
    }
    itemNum--;
    itemNum /= 2;
    contentRef.style.padding = `${itemHeight * itemNum}px 0`;
    indicatorRef.style.top = `${itemHeight * itemNum}px`;
    maskRef.style.backgroundSize = `100% ${itemHeight * itemNum}px`;

    this.scrollHandlers.setDisabled(this.props.disabled);
    this.select(this.state.selectedValue, this.itemHeight, this.scrollTo);

    const passiveSupported = this.passiveSupported();
    const willPreventDefault = passiveSupported ? {passive: false} : false;
    const willNotPreventDefault = passiveSupported ? {passive: true} : false;

    Object.keys(this.scrollHandlers).forEach(key => {
      if (key.indexOf('touch') === 0 || key.indexOf('mouse') === 0) {
        const pd = key.indexOf('move') >= 0 ? willPreventDefault : willNotPreventDefault;
        // @ts-ignore
        rootRef.addEventListener(key, this.scrollHandlers[key], pd);
      }
    });
  }

  componentWillReceiveProps(nextProps:PickerProps) {
    if ('selectedValue' in nextProps) {
      if (this.state.selectedValue !== nextProps.selectedValue) {
        this.setState(
          {
            selectedValue: nextProps.selectedValue,
          },
          () => {
            this.select(
              nextProps.selectedValue,
              this.itemHeight,
              nextProps.noAnimate ? this.scrollToWithoutAnimation : this.scrollTo,
            );
          },
        );
      }
    }
    this.scrollHandlers.setDisabled(nextProps.disabled);
  }

  shouldComponentUpdate(nextProps:PickerProps, nextState:any) {
    return this.state.selectedValue !== nextState.selectedValue || this.props.children !== nextProps.children;
  }

  componentDidUpdate() {
    this.select(this.state.selectedValue, this.itemHeight, this.scrollToWithoutAnimation);
  }

  componentWillUnmount() {
    Object.keys(this.scrollHandlers).forEach(key => {
      if (key.indexOf('touch') === 0 || key.indexOf('mouse') === 0) {
        // @ts-ignore
        this.rootRef.removeEventListener(key, this.scrollHandlers[key]);
      }
    });
  }
  select(value:any, itemHeight:number, scrollTo:any) {
    const children = React.Children.toArray(this.props.children);
    for (let i = 0, len = children.length; i < len; i++) {
      // @ts-ignore
      if (children[i].props.value === value) {
        this.selectByIndex(i, itemHeight, scrollTo);
        return;
      }
    }
    this.selectByIndex(0, itemHeight, scrollTo);
  }

  selectByIndex(index:number, itemHeight:number, zscrollTo:any) {
    if (index < 0 || index >=React.Children.count(this.props.children) || !itemHeight) {
      return;
    }
    zscrollTo(index * itemHeight);
  }

  computeChildIndex(top:number, itemHeight:number, childrenLength:number) {
    let index = top / itemHeight;
    const floor = Math.floor(index);
    if (index - floor > 0.5) {
      index = floor + 1;
    } else {
      index = floor;
    }
    return Math.min(index, childrenLength - 1);
  }

  doScrollingComplete(top:number, itemHeight:number, fireValueChange:any) {
    const children = React.Children.toArray(this.props.children);
    const index = this.computeChildIndex(top, itemHeight, children.length);
    const child: any = children[index];
    if (child) {
      fireValueChange(child.props.value);
    } else if (console.warn) {
      console.warn('child not found', child, index);
    }
  }

  render() {
    const {className, prefixCls, style, indicatorStyle, itemStyle, children} = this.props;


    const cls = classNames(prefixCls, {
      // @ts-ignore
      [className]: !!className,
    });

    const map = (item: any) => {
      const {className = '', style, value} = item.props;
      return (
        <div
          style={{...itemStyle, ...style}}
          key={value}
          className={classNames(`${prefixCls}-item`, className, {
            [`${prefixCls}-item-selected`]: value === this.state.selectedValue,
          })}
        >
          {item.children || item.props.children}
        </div>
      );
    };

    // @ts-ignore
    const items = React.Children ? React.Children.map(children, map) : [].concat(children).map(map);

    return (
      <div className={cls} style={style} ref={this.createRootRef}>
        <div className={`${prefixCls}-mask`} ref={this.createMaskRef} />
        <div className={`${prefixCls}-indicator`} style={indicatorStyle} ref={this.createIndicatorRef} />
        <div className={`${prefixCls}-content`} ref={this.createContentRef}>
          {items}
        </div>
      </div>
    );
  }
}

export default Picker;
