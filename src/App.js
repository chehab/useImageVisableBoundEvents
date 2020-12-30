import "./styles.css";
import React from "react";
import { get, has, round } from "lodash";
import { KeyChain, NameTag } from "./Imges";

export default function App() {
  const [nameCardRef, nameCardEvt] = useImageVisableEvents("NameTag", {
    onMouseMove: () => setIsHoverd("NameTag"),
    onMouseLeave: () => setIsHoverd(null)
  });

  const [keyChainRef] = useImageVisableEvents("KeyChain", {
    onMouseMove: () => setIsHoverd("KeyChain"),
    onMouseLeave: () => setIsHoverd(null)
  });
  const [isHoverd, setIsHoverd] = React.useState(null);
  const [mouseCord, setMouseCord] = React.useState({});
  const [elmCords, setElmCords] = React.useState({});
  const [, setMouseElement] = React.useState(null);

  // nameCardEvt({
  //   onMouseEnter: () => setIsHoverd("NameTag"),
  //   onMouseLeave: () => setIsHoverd(null)
  // });

  const getHandleOnMouseEnter = (name) => (evt) => {
    setIsHoverd(name);

    // console.log("MouseEnter:", name, evt);
  };

  const handleOnMouseLeaves = () => {
    setIsHoverd(false);
  };

  const handleonMouseMoves = (evt) => {
    setMouseCord({
      screenX: evt.screenX,
      screenY: evt.screenY,
      clientY: evt.clientY,
      clientX: evt.clientX
    });
  };

  const handleOnClick = (evt) => {
    const clientElm = document.elementFromPoint(evt.clientX, evt.clientY);

    const screenElm = document.elementFromPoint(evt.screenX, evt.screenY);

    const elm = {
      c: clientElm || [evt.clientX, evt.clientY],
      s: screenElm || [evt.screenX, evt.screenY]
    };

    setMouseElement(elm);

    const elmBounds = evt.target.getBoundingClientRect();

    setElmCords({
      x: evt.clientX - elmBounds.left,
      y: evt.clientY - elmBounds.top
    });

    // foobar(clientElm, evt);

    console.clear();
    console.log("on click", elm);
  };

  React.useEffect(() => {
    document.body.onmousemove = handleonMouseMoves;
    alert("init");
  }, []);

  return (
    <div className="App">
      <h1>Hoverd {isHoverd?.toString()}</h1>
      <h2>{Object.entries(mouseCord).join(" - ")}</h2>
      <h2>{Object.entries(elmCords).join(" - ")}</h2>
      <NameTag
        ref={nameCardRef}
        // onClick={handleOnClick}
        // onMouseMove={handleonMouseMoves}
        // onMouseLeave={handleOnMouseLeaves}
        // onMouseEnter={getHandleOnMouseEnter("NameTag")}
      />
      <KeyChain
        ref={keyChainRef}
        // onClick={handleOnClick}
        // onMouseMove={handleonMouseMoves}
        // onMouseLeave={handleOnMouseLeaves}
        // onMouseEnter={getHandleOnMouseEnter("KeyChain")}
      />
    </div>
  );
}

function foobar(elm, evt) {
  const PX_ALPHA_TOLERANCE = 40;

  const pxMap = {};
  const canvas = document.createElement("canvas");
  canvas.width = elm.width;
  canvas.height = elm.height;

  const ctx = canvas.getContext("2d");
  // ctx.drawImage(elm, 0, 0);
  ctx.drawImage(
    elm,
    0,
    0,
    canvas.width,
    canvas.height,
    0,
    0,
    elm.width,
    elm.height
  );

  for (let x = 0; x < canvas.width; x++) {
    for (let y = 0; y < canvas.height; y++) {
      const px = ctx.getImageData(x, y, 1, 1);
      pxMap[`${x}_${y}`] = px.data[3] > PX_ALPHA_TOLERANCE;

      if (px.data[3] > PX_ALPHA_TOLERANCE) {
        const d = new Uint8ClampedArray([0, 0, 0, 255]);
        ctx.putImageData(new ImageData(d, px.width, px.height), x, y);
      } else {
        const d = new Uint8ClampedArray([255, 0, 0, 125]);
        ctx.putImageData(new ImageData(d, px.width, px.height), x, y);
      }
    }
  }

  document.body.append(canvas);

  return [canvas, ctx];
}

function useImageVisableEvents(id, events) {
  const elmRef = React.useRef();
  const canvasRef = React.useRef(null);
  const ctxRef = React.useRef(null);
  const pxMapRef = React.useRef(null);
  const [evtMap, setEvtMap] = React.useState(events);
  const [evtState, setEvtState] = React.useState({});
  // const [pxMap, setPxMap] = React.useState({});

  const getElm = () => elmRef.current;

  const getEvtState = () => evtState;

  const getCanvas = () => canvasRef.current;
  const setCanvas = (value) => (canvasRef.current = value);

  const getCtx = () => ctxRef.current;
  const setCtx = (value) => (ctxRef.current = value);

  const getPxMap = () => pxMapRef.current;
  const setPxMap = (value) => (pxMapRef.current = value);

  React.useEffect(() => {
    const cleanupCanvas = updateCanvas({ getElm, setCanvas, setCtx });
    const cleanupPxMap = updatePxMap({ id, getCtx, getCanvas, setPxMap });
    const cleanupEvents = connectEvents({
      setEvtState,
      getEvtState,
      getPxMap,
      getElm,
      evtMap
    });

    return () => {
      cleanupCanvas();
      cleanupPxMap();
      cleanupEvents();
    };
  }, [elmRef.current]);

  // React.useEffect(connectEvents({ evtMap, getPxMap, getElm }), [evtMap]);

  return [elmRef, setEvtMap];

  // ------------
}

const UNBOUND_EVENTS = ["mouseleave"];

function connectEvents({ setEvtState, getEvtState, evtMap, getPxMap, getElm }) {
  return () => {
    const elm = getElm();

    debugger;

    if (!elm || !evtMap) {
      return null;
    }

    const evtRefMap = Object.entries(evtMap).map(([evtName, evtHandler]) => {
      debugger;

      const evtType = evtName.toString().replace(/^on/, "").toLowerCase();

      const evtHandlersList = {
        mouseleave: null
      };

      const handler = get(
        evtHandlersList,
        evtType,
        getVisablyBoundEventHandler({
          setEvtState,
          getEvtState,
          evtHandler,
          getPxMap,
          evtType
        })
      );

      elm?.addEventListener(evtType, handler);

      return handler;
    });

    return () => evtRefMap.forEach((evtRef) => elm.removeEventListener(evtRef));
  };
}

function getVisablyBoundEventHandler({ evtType, evtHandler, getPxMap }) {
  return (evt) => {
    const { x, y } = evtMosueInBounds(evt);
    const pxMap = getPxMap();
    const px = `${round(x)}_${round(y)}`;
    const isBoundRequired = has(UNBOUND_EVENTS, evtType);
    const isInBounds = get(pxMap, px, false);

    console.log(isInBounds ? " IN" : "OUT", evtType, "@", px, pxMap);

    debugger;

    if (isInBounds || !isBoundRequired) {
      // console.log("evt: (in-of-bound)", evtName, evtHandler.name);
      evtHandler(evt);
    } else {
      // console.log("evt: (out-of-bound)", evtName, evtHandler.name);
    }
  };
}

function updatePxMap({ id, getCtx, getCanvas, setPxMap }) {
  const PX_ALPHA_TOLERANCE = 60;

  return () => {
    const canvas = getCanvas();
    const ctx = getCtx();

    const _pxMap = { _id_: id };

    for (let x = 0; x < canvas?.width; x++) {
      for (let y = 0; y < canvas?.height; y++) {
        const px = ctx.getImageData(x, y, 1, 1);

        _pxMap[`${x}_${y}`] = px.data[3] > PX_ALPHA_TOLERANCE;

        if (px.data[3] > PX_ALPHA_TOLERANCE) {
          const d = new Uint8ClampedArray([0, 0, 0, 255]);
          ctx.putImageData(new ImageData(d, px.width, px.height), x, y);
        } else {
          const d = new Uint8ClampedArray([255, 0, 0, 125]);
          ctx.putImageData(new ImageData(d, px.width, px.height), x, y);
        }
      }
    }

    setPxMap(_pxMap);
  };
}

function updateCanvas({ getElm, setCanvas, setCtx }) {
  const IS_DEBUG = true;

  return () => {
    const elm = getElm();

    const _cvs = document.createElement("canvas");
    _cvs.width = elm.width;
    _cvs.height = elm.height;

    const _ctx = _cvs.getContext("2d");

    _ctx.drawImage(
      elm,
      0,
      0,
      _cvs.width,
      _cvs.height,
      0,
      0,
      elm.width,
      elm.height
    );

    if (IS_DEBUG) {
      document.body.append(_cvs);
    }

    setCanvas(_cvs);
    setCtx(_ctx);
  };
}

function evtMosueInBounds(evt) {
  const elmBounds = evt.target.getBoundingClientRect();

  return {
    x: evt.clientX - elmBounds.left,
    y: evt.clientY - elmBounds.top
  };
}
