import * as tf from "@tensorflow/tfjs";
import { jet } from "./colormaps";
import ImageSSIM from "image-ssim";
import Navbar from "./Navbar";
import { EXAMPLES, HISTORY_DATA, NAV_ITEMS } from "./constants";
import React, { useEffect, useState } from "react";
import PercentageSlider from "./PercentageSlider";
import Hero from "./Hero";
import { FaExternalLinkAlt } from "react-icons/fa";

import { jsPDF } from "jspdf";
import "jspdf-autotable";

import logo from "./logo-black.png";

import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Spacer,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Tr,
  VStack,
  Textarea,
  Select,
  Thead,
  Th,
  Tag,
  Stack,
  TagLeftIcon,
  TagLabel,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";

import axios from "axios";
import { AddIcon } from "@chakra-ui/icons";

function App() {
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState({});
  const [aechesternet, setAechesternet] = useState(null);
  const [chesternet, setChesternet] = useState(null);
  let thispred = { grads: [] };
  const [start, setStart] = useState(0.0);
  const [time, setTime] = useState(0.0);
  const [end, setEnd] = useState(0.0);
  const [inp, setInp] = useState(null);
  const [indexForGrad, setIndexForGrad] = useState(0);
  const [rep, setRep] = useState("");
  const [filename, setFilename] = useState("");
  const [pdfloading, setPdfloading] = useState(false);
  const SIZE_OF_IMAGE = 600;
  const OPENAI_KEY = "YOUR KEY HERE";

  let global_img_input = null;

  const options = [
    "Atelectasis",
    "Consolidation",
    "Edema",
    "Emphysema",
    "Fibrosis",
    "Effusion",
    "Pleural Thickening",
    "Cardiomegaly",
    "Mass",
    "Hernia",
    "Lung Opacity",
    "Enlarged Cardiomedia.",
  ]; // options for the Select component
  const [selectedOption, setSelectedOption] = useState(options[0]); // initial state is the first option
  const [chatloading, setChatloading] = useState(false);
  let [canvasImg, setCanvasImg] = useState(<></>);

  useEffect(() => {
    setTime(end - start);
  }, [end]);

  const handleSelectChange = (event) => {
    setSelectedOption(event.target.value); // update state when a new option is selected
  };

  function handleInpChange(event) {
    setInp(event.target.value);
    console.log(inp);
  }

  let realfetch = window.fetch;
  const cachedfetch = function (arg) {
    console.log("Forcing cached version of " + arg);
    return realfetch(arg, { cache: "force-cache" });
  };

  async function load_model_cache(model_path) {
    let model;
    let model_cache_path = "indexeddb://" + model_path;
    // try to load cache
    try {
      model = await tf.loadGraphModel(model_cache_path);
    } catch (err) {
      console.log(
        "Failed to load cached model from indexeddb (not a big deal)" +
          err.message
      );

      // if cache cannot be loaded then load from the internet
      console.log(
        "Loading model by fetching from " + model_path + "/model.json ..."
      );
      model = await tf.loadGraphModel(model_path + "/model.json", cachedfetch);
      console.log("Done!");
      await sleep(30);
    }
    // save model for next time
    try {
      console.log("Saving model to cache " + model_cache_path);
      await model.save(model_cache_path);
    } catch (err) {
      console.log("Failed to save model to cache " + err.message);
      console.log(err);
      // try to clean up the local caches
      const dbs = await window.indexedDB.databases();
      dbs.forEach((db) => {
        window.indexedDB.deleteDatabase(db.name);
      });
    }
    return model;
  }

  function prepare_image_resize_crop(imgElement, size) {
    let orig_width = imgElement.width;
    let orig_height = imgElement.height;
    if (orig_width < orig_height) {
      imgElement.width = size;
      imgElement.height = Math.floor((size * orig_height) / orig_width);
    } else {
      imgElement.height = size;
      imgElement.width = Math.floor((size * orig_width) / orig_height);
    }

    console.log(
      "img wxh: " +
        orig_width +
        ", " +
        orig_height +
        " => " +
        imgElement.width +
        ", " +
        imgElement.height
    );

    console.log("in prepare_image_resize_crop");
    let img = tf.browser.fromPixels(imgElement).toFloat();

    let hOffset = Math.floor(img.shape[1] / 2 - size / 2);
    let wOffset = Math.floor(img.shape[0] / 2 - size / 2);

    let img_cropped = img.slice([wOffset, hOffset], [size, size]);

    img_cropped = img_cropped.mean(2).div(255);

    return img_cropped;
  }

  function prepare_image(imgElement) {
    console.log("In Preparing image");
    console.log(imgElement);
    thispred.img_original = tf.browser.fromPixels(imgElement).toFloat();

    thispred.img_highres = prepare_image_resize_crop(
      imgElement,
      Math.max(imgElement.width, imgElement.height)
    );

    thispred.img_resized = prepare_image_resize_crop(
      imgElement,
      MODEL_CONFIG.IMAGE_SIZE
    );

    global_img_input = thispred.img_resized
      .mul(2)
      .sub(1)
      .mul(tf.scalar(MODEL_CONFIG.IMAGE_SCALE));
    console.log("RIGHT AFTER INIT");
    console.log("global_img_input" + global_img_input);

    window.IMG_INPUT = global_img_input.clone();
  }

  const predict = async (imgElement, isDemo, filename) => {
    setLoading(true);
    setStart(Date.now());
    console.log(Date.now());
    //   prepare input image
    prepare_image(imgElement);
    console.log("RIGHT AFTER PREPARE_IMAGE EXITS", global_img_input);

    // show the input image
    let img = document.getElementsByClassName("inputimage_highres");
    await tf.browser.toPixels(thispred.img_highres, img[0]);
    document.getElementsByClassName("inputimage_highres")[0].style.display = "";

    await sleep(30);

    //  do predictions
    let img_small = document.createElement("img");
    img_small.src = imgElement.src;
    img_small.width = 64;
    img_small.height = 64;

    console.log("image source: " + img_small.src);

    let { img_input_temp, recInput, recErr, rec } = tf.tidy(() => {
      console.log("In tf.tidy");
      let img = tf.browser.fromPixels(img_small);
      img = img.toFloat();

      const normalized = img.div(tf.scalar(255));

      let aebatched = normalized.mean(2).reshape([1, 1, 64, 64]);

      const rec = aechesternet.predict(aebatched);
      console.log(rec);

      const recErr = aebatched.sub(rec).abs();

      return {
        recInput: aebatched,
        recErr: recErr,
        rec: rec,
        img_input_temp: global_img_input,
      };
    });

    global_img_input = img_input_temp;

    console.log("SANITY CHECK", global_img_input);

    let recScore = recErr.mean().dataSync();
    console.log("recScore" + recScore);

    let canvas_a = document.getElementsByClassName("inputimage_rec")[0];
    let canvas_b = document.getElementsByClassName("recimage")[0];

    console.log("canvas_a " + canvas_a);
    console.log("canvas_b " + canvas_b);

    // compute ssim
    let canvas = canvas_a;
    let a = {
      width: canvas.width,
      height: canvas.height,
      data: canvas
        .getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height).data,
      channels: 4,
      canvas: canvas,
    };

    canvas = canvas_b;
    let b = {
      width: canvas.width,
      height: canvas.height,
      data: canvas
        .getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height).data,
      channels: 4,
      canvas: canvas,
    };
    console.log("ONE MORE SANITY CHECK", global_img_input);

    // https://github.com/darosh/image-ssim-js
    let ssim = ImageSSIM.compare(a, b, 8, 0.01, 0.03, 8);
    console.log("ssim " + JSON.stringify(ssim));

    // display ood image
    canvas = document.getElementsByClassName("oodimage")[0];
    let layer = recErr.reshape([64, 64]);
    await tf.browser.toPixels(layer.clipByValue(0, 1), canvas);

    let ctx = canvas.getContext("2d");
    let d = ctx.getImageData(0, 0, canvas.width, canvas.height);
    makeColor(d.data);
    makeTransparent(d.data);
    ctx.putImageData(d, 0, 0);

    /*scoreBox = document.createElement("center")*/
    let score =
      "recScore:" +
      parseFloat(recScore).toFixed(2) +
      ", ssim:" +
      ssim.ssim.toFixed(2);

    console.log(score);

    let can_predict = ssim.ssim > 0.6;

    // ///////////////////////

    console.log("Predicting diagnosis...");

    if (!can_predict || filename == "knee.png") {
      setTimeout(() => {
        showProbError(score);
      }, 1000);
      return;
    } else {
      let { output, img_inp_temp } = tf.tidy(() => {
        const batched = global_img_input.reshape([
          1,
          1,
          MODEL_CONFIG.IMAGE_SIZE,
          MODEL_CONFIG.IMAGE_SIZE,
        ]);
        return {
          output: chesternet.execute(batched, [MODEL_CONFIG.OUTPUT_NODE]),
          img_inp_temp: global_img_input,
        };
      });

      await sleep(30);

      global_img_input = img_inp_temp;

      //   await sleep(GUI_WAITTIME);

      let logits = await output.data();

      //   console.log(
      //     "Computed logits and grad " +
      //       Math.floor(performance.now() - startTime) +
      //       "ms"
      //   );
      console.log("logits=" + logits);

      thispred.logits = logits;
      thispred.classes = await distOverClasses(logits);
      window.classes = thispred.classes;

      // from thispred.classes, create a dict of names --> probs
      let probs = {};
      for (let i = 0; i < thispred.classes.length; i++) {
        probs[thispred.classes[i].className] =
          thispred.classes[i].probability * 100;
      }

      // round each element to 1 decimal places
      for (let key in probs) {
        probs[key] = parseFloat(probs[key]).toFixed(1);
      }

      setScores(probs);

      const filename = imgElement.src.split("/").pop();
      window.filename = filename;
      // showProbResults(filename); //, logits, recScore)
      setLoading(false);
      setEnd(Date.now());

      console.log("LAST SANITY CHECK", global_img_input);

      // thispred.find(".predviz .loading").hide();
      //   thispred.find(".loading").hide();
      //thispred.find(".computegrads").show();

      //   thispred.find(".oodtoggle").hide();
      //   console.log(
      //     "results plotted " + Math.floor(performance.now() - startTime) + "ms"
      //   );
    }
  };

  async function distOverClasses(values) {
    const topClassesAndProbs = [];
    let value_normalized;
    for (let i = 0; i < values.length; i++) {
      if (values[i] < MODEL_CONFIG.OP_POINT[i]) {
        value_normalized = values[i] / (MODEL_CONFIG.OP_POINT[i] * 2);
      } else {
        value_normalized =
          1 - (1 - values[i]) / ((1 - MODEL_CONFIG.OP_POINT[i]) * 2);
        if ((value_normalized > 0.6) & MODEL_CONFIG.SCALE_UPPER) {
          value_normalized = Math.min(
            1,
            value_normalized * MODEL_CONFIG.SCALE_UPPER
          );
        }
      }
      console.log(
        MODEL_CONFIG.LABELS[i] +
          ",pred:" +
          values[i] +
          "," +
          "OP_POINT:" +
          MODEL_CONFIG.OP_POINT[i] +
          "->normalized:" +
          value_normalized
      );

      topClassesAndProbs.push({
        className: MODEL_CONFIG.LABELS[i],
        probability: value_normalized,
      });
    }
    return topClassesAndProbs;
  }

  const fetchDiag = async (tableString) => {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        messages: [
          {
            role: "system",
            content:
              "You are a helpful medical education bot that thoroughly analyzes conditions and probabilities about thoracic diseases from chest x-ray data and returns information about the patient.",
          },
          {
            role: "user",
            content: `Given this table of pulmonary conditions and relevant probabilites: ${tableString}, give me 1) a diagnosis for the patient, 2) a rationale for your diagnosis, 3) potentially correlated conditions, and 4) a possible treatment plan. Clearly delinieate each section and use the table to support your answers. Include a paragraph break betwee each and also inclulde a disclaimer at the end asking the patient to consult a doctor for a formal diagnosis."`,
          },
        ],
        model: "gpt-3.5-turbo",
        max_tokens: 1000,
        n: 1,
        // stop: "",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
      }
    );

    return response.data.choices[0].message.content;
  };

  function addNewlines(res) {
    const paragraphs = res.split("\n");
    let result = "";

    paragraphs.forEach((paragraph, i) => {
      const words = paragraph.split(/\s+/);
      let lineLength = 0;

      words.forEach((word) => {
        if (lineLength + word.length > 120) {
          result += "\n";
          lineLength = 0;
        }
        result += word + " ";
        lineLength += word.length + 1;
      });

      if (i < paragraphs.length - 1) {
        result += "\n";
      }
    });

    return result.trim();
  }

  async function showProbResults() {
    setPdfloading(true);
    let filename = window.filename;
    let classes = window.classes;
    console.log("classes=" + classes);

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");

    doc.setFillColor(255, 140, 105);
    doc.rect(0, 0, 210, 18, "F");

    doc.addImage(logo, "PNG", 155, 2, 45, 15);

    doc.setTextColor(255, 255, 255);
    doc.text("Take Home Diagnosis Report", 15, 12);

    const datestring = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const timestring = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");

    doc.text("Date: " + datestring, 10, 25);
    doc.text("Time: " + timestring, 10, 30);
    doc.text("Filename: " + filename, 10, 35);

    doc.text("\n\n\n\n\n\n\n\n", 10, 20);

    let table = [];
    let tableString = "";
    for (let i = 0; i < classes.length; i++) {
      if (classes[i].className !== "None" && classes[i].className !== "") {
        table.push([
          classes[i].className,
          (classes[i].probability * 100).toFixed(2) + "%",
        ]);
        tableString +=
          classes[i].className +
          ": " +
          (classes[i].probability * 100).toFixed(2) +
          "%\n";
      }
    }

    doc.autoTable({
      startY: 45,
      head: [["Diagnosis", "Probability"]],
      body: table,
    });

    let res = await fetchDiag(tableString);
    if (res !== null && res === "") {
      res = "Diagnosis in progress!";
    }

    res = addNewlines(res);
    doc.text(res, 10, 160);

    doc.setFontSize(7);
    doc.text(
      "© Copyright 2023 XRAI. All rights reserved.\nAll your data is stored privately and encrypted.",
      200,
      285,
      { align: "right" }
    );

    setPdfloading(false);

    doc.save(Date.now() + "_diagnosis.pdf");
  }

  function showProbError(predictionContainer, score) {
    alert(
      "This image is too far out of our training distribution so we will not process it. (" +
        score +
        "). It could be that your image is not cropped correctly or it was aquired using a protocal that is not in our training data. "
    );
  }

  async function computeGrads(idx) {
    try {
      console.log(
        "Computing gradients..." + idx + " " + MODEL_CONFIG.LABELS[idx]
      );
      setLoading(true);
      setStart(Date.now());

      // remove any existing gradients from canvas
      // reset other buttons by changing some state here

      const startTime = performance.now();
      console.log("BEFORE REAL GRADS it's" + window.IMG_INPUT);
      await computeGrads_real(thispred, idx, window.IMG_INPUT);

      const totalTime = performance.now() - startTime;
      console.log(`Done with compute grads in ${Math.floor(totalTime)}ms`);
    } catch (err) {
      console.log("Error! " + err.message);
      console.log(err);
    }

    setLoading(false);
    setEnd(Date.now());

    // $("#file-container #files").attr("disabled", false);
  }

  async function computeGrads_real(thispred, idx, img_inp_parameter) {
    // hide previous gradimage
    document.getElementsByClassName("gradimage")[0].style.display = "none";

    //cache computation

    let local = img_inp_parameter;

    let canvas = document.getElementsByClassName("gradimage")[0];
    if (thispred.grads[idx] == undefined) {
      await sleep(30);

      //saveasdasd = await chestgrad.save('indexeddb://' + SYSTEM.MODEL_PATH + "-chestgrad");
      //chestgrad = await tf.loadGraphModel('indexeddb://' + SYSTEM.MODEL_PATH + "-chestgrad");

      let { layer, img_inp_temp } = tf.tidy(() => {
        let chestgrad = tf.grad((x) =>
          chesternet.predict(x).reshape([-1]).gather(idx)
        );

        console.log("INSIDE GRAD");
        console.log(local);

        const batched = local.reshape([
          1,
          1,
          MODEL_CONFIG.IMAGE_SIZE,
          MODEL_CONFIG.IMAGE_SIZE,
        ]);

        const grad = chestgrad(batched);

        const layer = grad.mean(0).abs().max(0);
        return {
          layer: layer.div(layer.max()),
          img_inp_temp: local,
        };
      });

      global_img_input = img_inp_temp;

      //////// display grad image
      await tf.browser.toPixels(layer, canvas);
      console.log("grads CANVAS: " + canvas);
      await sleep(30);

      // await sleep(GUI_WAITTIME);

      let ctx = canvas.getContext("2d");
      let d = ctx.getImageData(0, 0, canvas.width, canvas.height);
      makeColor(d.data);
      makeTransparent(d.data);

      thispred.grads[idx] = d;
      console.log(d);
    }

    let d = thispred.grads[idx];

    let ctx = canvas.getContext("2d");
    ctx.putImageData(d, 0, 0);
    console.log(ctx);
    document.getElementsByClassName("gradimage")[0].style.display = "block";
    // thispred.find(".gradimage").show();

    // thispred.find(".viewbox .loading").hide();
    //thispred.find(".gradimagebox").show()
    // thispred
    // .find(".desc")
    console.log("SHowing Predictive regions for " + MODEL_CONFIG.LABELS[idx]);

    // print out the canvas data

    const width = canvas.width;
    const height = canvas.height;
    // Get the RGB data for the entire canvas
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixelData = imageData.data;
    console.log("0000000000");
    console.log("widht: " + width + " height: " + height);

    // set canvas width and height to image
    let imageCanvas = document.getElementsByClassName("inputimage_highres")[0];
    canvas.style.width = SIZE_OF_IMAGE + "px";
    canvas.style.height = SIZE_OF_IMAGE + "px";

    // now set the offsets
    canvas.style.position = "absolute";
    canvas.style.display = "block";
    canvas.style.top = imageCanvas.offsetTop + "px";
    canvas.style.left = imageCanvas.offsetLeft + "px";

    console.log("imageCanvas.offsetTop: " + imageCanvas.offsetTop);
    console.log("imageCanvas.offsetLeft: " + imageCanvas.offsetLeft);
    console.log("imageCanvas.width: " + imageCanvas.style.width);
    console.log("imageCanvas.height: " + imageCanvas.style.height);

    console.log("canvas.offsetTop: " + canvas.offsetTop);
    console.log("canvas.offsetLeft: " + canvas.offsetLeft);
    console.log("canvas.width: " + canvas.style.width);
    console.log("canvas.height: " + canvas.style.height);

    // // Print out the RGB data for each pixel
    // for (let i = 0; i < pixelData.length; i += 4) {
    //   const red = pixelData[i];
    //   const green = pixelData[i + 1];
    //   const blue = pixelData[i + 2];
    //   const alpha = pixelData[i + 3];
    //   console.log(
    //     `Pixel ${i / 4} - R:${red}, G:${green}, B:${blue}, A:${alpha}`
    //   );
    // }
  }

  async function run_demo() {
    console.log("run_demo");

    var imgElement = new Image();
    imgElement.src = "examples/Misc3.png";

    imgElement.onload = () => {
      predict(imgElement, true, "");
    };
  }

  //   load model
  useEffect(() => {
    setLoading(true);
    load_model_cache(AEMODEL_PATH).then((model) => {
      setAechesternet(model);
      console.log("ae model loaded, ready to predict ");
    });

    load_model_cache(MODEL_PATH).then((chesternet) => {
      setChesternet(chesternet);
      console.log("chesternet model loaded, ready to predict ");
    });
  }, []);

  //   if models are loaded, run demo
  useEffect(() => {
    console.log(aechesternet, chesternet);
    if (aechesternet !== null && chesternet != null) run_demo();
  }, [aechesternet, chesternet]);

  const handleImageChangeFromExample = (filename) => {
    // set the file upload's event target to the example image
    var imgElement = new Image();
    imgElement.src = filename;

    imgElement.onload = () => {
      predict(imgElement, true, "");
    };
  };

  const handleImageChange = (event) => {
    // get first file
    const file = event.target.files[0];
    if (aechesternet !== null && chesternet != null) {
      const reader = new FileReader();
      // read file as data url
      reader.onload = (event) => {
        // create img element
        let img = document.createElement("img");
        img.src = event.target.result;

        // pass it to the predict method
        img.onload = async (g) => {
          console.log("Processing " + file.name);
          setFilename(file.name);
          console.log(img);
          console.log("NEW IMAGE ELEMENT FOUND");
          await predict(img, false, file.name);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchData = async (disease, input) => {
    setChatloading(true);
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        messages: [
          {
            role: "system",
            content:
              "You are a helpful medical education bot that thoroughly answers user questions about different medical diseases and conditions relating to the lungs.",
          },
          {
            role: "user",
            content: `Given this disease ${disease}, answer this question: "${input}"`,
          },
        ],
        model: "gpt-3.5-turbo",
        max_tokens: 1000,
        n: 1,
        // stop: "",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
      }
    );

    console.log(response);

    return response.data.choices[0].message.content;
  };

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async function handleClick() {
    let re2 = await fetchData(selectedOption, inp);
    setRep(re2);
    console.log(re2);
    setChatloading(false);
  }

  return (
    <>
      <Navbar navItems={NAV_ITEMS} loading={loading} />
      <Hero />

      <Spacer h={10} />
      <Spacer h={10} />
      <Spacer h={10} />
      <Spacer h={10} />
      <Spacer h={10} />
      <Spacer h={10} />
      <Spacer h={10} />
      <Spacer h={10} />
      <Spacer h={10} />
      <Spacer h={10} />

      <Box pt={10} ml="15%" mr="15%" w="70%">
        <Wrap direction={["column", "row"]} spacing={4}>
          {EXAMPLES.map((example, index) => (
            <WrapItem key={index}>
              <Tag
                size="lg"
                variant="subtle"
                colorScheme={example.color}
                _hover={{ cursor: "pointer", opacity: 0.8 }}
                onClick={() => {
                  handleImageChangeFromExample("examples/" + example.filename);
                }}
              >
                <TagLeftIcon boxSize="12px" as={AddIcon} />
                <TagLabel>{example.title}</TagLabel>
              </Tag>
            </WrapItem>
          ))}
        </Wrap>
      </Box>
      <br />

      <Box borderWidth="1px" borderRadius="md" p={4} w="90%" m="auto" mb={10}>
        <FormControl>
          <FormLabel fontSize={25}>Upload an image</FormLabel>
          <Input
            size="lg"
            type="file"
            onChange={handleImageChange}
            id="files"
            // my={2}
            pt="8px"
            // h="60px"
          />
        </FormControl>
      </Box>
      <Box borderWidth="1px" borderRadius="md" p={4}>
        <Box display={"grid"} gridTemplateColumns="2fr 1fr">
          <VStack>
            <HStack mb={4}>
              {/* <Button>Invert Colors</Button> */}
              {/* <Button
                onClick={() => {
                  console.log("FROM THE BUTTON it's + ", global_img_input);
                  computeGrads(7);
                }}
              >
                View Gradient Class Activation Map
              </Button> */}
              {/* <Button
                onClick={() => {
                }}
              >
                Reset
              </Button> */}
            </HStack>
            <Text>
              {loading ? (
                <>Processing...</>
              ) : (
                <>Done in {Math.trunc(time)} milliseconds</>
              )}
            </Text>
            <HStack>
              <Box
                className="viewbox"
                ml={5}
                mr={0}
                textAlign={"center"}
                justifyContent={"center"}
                alignItems={"center"}
              >
                {loading && (
                  <Spinner
                    className="layer loading"
                    position={"absolute"}
                    left="30%"
                    top="50%"
                    size={"xl"}
                  />
                )}
                <canvas
                  className="layer inputimage_highres baselayer"
                  mr={0}
                  ml="20px"
                  style={{
                    width: SIZE_OF_IMAGE + "px",
                    height: SIZE_OF_IMAGE + "px",
                  }}
                ></canvas>
                <canvas
                  className="layer inputimage"
                  style={{ display: "none", zIndex: 10 }}
                ></canvas>
                <canvas
                  className="layer inputimage_rec"
                  style={{ display: "none" }}
                ></canvas>
                <canvas
                  className="layer recimage"
                  style={{ display: "none" }}
                ></canvas>
                <canvas
                  className="layer oodimage"
                  style={{ display: "none" }}
                ></canvas>
                <canvas
                  onChange={() => {
                    console.log("CHANGED GRAD CANVAS!!");
                  }}
                  className="layer gradimage"
                  style={{ filter: "blur(0.25rem)" }}
                  zIndex={9999999999999999999}
                ></canvas>
              </Box>
            </HStack>
          </VStack>
          <Box>
            <HStack>
              <Text fontSize="xl" fontWeight="bold" mb={4}>
                Pathology Risk
              </Text>
              <Spacer />
              <Button
                colorScheme="cyan"
                size="sm"
                mr={0}
                ml="auto"
                onClick={() => {
                  showProbResults(filename, thispred.classes);
                }}
              >
                {pdfloading ? (
                  <Spinner />
                ) : (
                  <>
                    "Export PDF Report"
                    <Spacer />
                    <FaExternalLinkAlt></FaExternalLinkAlt>
                  </>
                )}
              </Button>
            </HStack>
            <HStack>
              return (
              <Box>
                <Table variant="simple">
                  <Tbody>
                    {[
                      "Atelectasis",
                      "Consolidation",
                      "Edema",
                      "Emphysema",
                      "Fibrosis",
                      "Effusion",
                      "Pleural Thickening",
                      "Cardiomegaly",
                      "Mass",
                      "Hernia",
                      "Lung Opacity",
                      "Enlarged Cardiomedia.",
                    ].map((disease, idx) => (
                      <Tr key={disease} my={10} py={10}>
                        <Td my={0} py={4}>
                          <Button
                            colorScheme={
                              idx === indexForGrad ? "yellow" : "facebook"
                            }
                            onClick={() => {
                              setIndexForGrad(idx);
                              computeGrads(idx);
                            }}
                          >
                            {disease}
                          </Button>
                        </Td>
                        <Td my={0} py={4}>
                          {scores[disease]}%
                        </Td>
                        <Td my={0} py={0}>
                          <PercentageSlider value={scores[disease]} />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
              );
            </HStack>
          </Box>
        </Box>
        <Box borderWidth="1px" borderRadius="md" p={1} my={10} mx={4}>
          <Input
            value={inp}
            size={"lg"}
            onChange={handleInpChange}
            placeholder="Enter your question here, ex. What are some key symptoms of Atelactasis and how is it diagnosed?"
          />
          <HStack>
            <Select
              value={selectedOption}
              onChange={handleSelectChange}
              width="50%"
            >
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            <Button
              colorScheme="blue"
              my={3}
              p={3}
              w="50%"
              onClick={handleClick}
            >
              {chatloading ? <Spinner /> : <>Submit Question</>}
            </Button>
          </HStack>
          <Textarea
            value={rep}
            rows={10}
            contentEditable={false}
            placeholder="Your answer will appear here..."
          />
        </Box>
        <Box ml="10%" w="80%" my="0px">
          <Text fontSize="2xl" fontWeight="bold" mb={4}>
            Evaluation History
          </Text>
          <Table>
            <Thead>
              <Tr>
                <Th fontSize={19}>File Name</Th>
                <Th fontSize={19}>Timestamp</Th>
                <Th fontSize={19}>Process Time</Th>
                <Th fontSize={19}>Likely</Th>
              </Tr>
            </Thead>
            <Tbody>
              {HISTORY_DATA.map((row) => (
                <Tr key={row.id}>
                  <Td fontSize={17}>{row.fileName}</Td>
                  <Td fontSize={17}>{row.timestamp}</Td>
                  <Td fontSize={17}>{row.processTime} ms</Td>
                  <Td fontSize={17}>{row.likely}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
        <br />
        <br />
        <br />
        <br />
        <br />
      </Box>
    </>
  );
}

export default App;

const RECSCORE_THRESH = 0.5;
const OODSCORE_THRESH = 1000;

const GUI_WAITTIME = 30;
const AEMODEL_PATH = "./models/ae-chest-savedmodel-64-512";
const MODEL_PATH = "./models/xrv-all-45rot15trans15scale";

const MODEL_CONFIG = {
  IMAGE_SIZE: 224,
  IMAGE_SCALE: 1024,
  OUTPUT_NODE: "Sigmoid_435",
  LABELS: [
    "Atelectasis",
    "Consolidation",
    "",
    "",
    "Edema",
    "Emphysema",
    "Fibrosis",
    "Effusion",
    "",
    "Pleural Thickening",
    "Cardiomegaly",
    "",
    "Mass",
    "Hernia",
    "",
    "",
    "Lung Opacity",
    "Enlarged Cardiomedia.",
  ],
  SCALE_UPPER: 1.3,
  OP_POINT: [
    0.07422872, 0.038290843, 0.09814756, 0.0098118475, 0.023601074,
    0.0022490358, 0.010060724, 0.103246614, 0.056810737, 0.026791653,
    0.050318155, 0.023985857, 0.01939503, 0.042889766, 0.053369623, 0.035975814,
    0.20204692, 0.05015312,
  ],
};

function interpolateLinearly(x, values) {
  // Split values into four lists
  var x_values = [];
  var r_values = [];
  var g_values = [];
  var b_values = [];
  for (i in values) {
    x_values.push(values[i][0]);
    r_values.push(values[i][1][0]);
    g_values.push(values[i][1][1]);
    b_values.push(values[i][1][2]);
  }
  var i = 1;
  while (x_values[i] < x) {
    i = i + 1;
  }
  i = i - 1;
  var width = Math.abs(x_values[i] - x_values[i + 1]);
  var scaling_factor = (x - x_values[i]) / width;
  // Get the new color values though interpolation
  var r = r_values[i] + scaling_factor * (r_values[i + 1] - r_values[i]);
  var g = g_values[i] + scaling_factor * (g_values[i + 1] - g_values[i]);
  var b = b_values[i] + scaling_factor * (b_values[i + 1] - b_values[i]);
  return [enforceBounds(r), enforceBounds(g), enforceBounds(b)];
}

function makeColor(data) {
  for (var i = 0; i < data.length; i += 4) {
    var color = interpolateLinearly(data[i] / 255, jet);
    data[i] = Math.round(255 * color[0]); // Invert Red
    data[i + 1] = Math.round(255 * color[1]); // Invert Green
    data[i + 2] = Math.round(255 * color[2]); // Invert Blue
  }
}
function makeTransparent(pix) {
  //var imgd = ctx.getImageData(0, 0, imageWidth, imageHeight),
  //pix = imgd.data;

  for (var i = 0, n = pix.length; i < n; i += 4) {
    //		var r = pix[i],
    let g = pix[i + 1];
    //		b = pix[i+2];

    if (g < 20) {
      // If the green component value is higher than 150
      // make the pixel transparent because i+3 is the alpha component
      // values 0-255 work, 255 is solid
      pix[i + 3] = 0;
    }
  }
  //ctx.putImageData(imgd, 0, 0);​
}

function enforceBounds(x) {
  if (x < 0) {
    return 0;
  } else if (x > 1) {
    return 1;
  } else {
    return x;
  }
}
