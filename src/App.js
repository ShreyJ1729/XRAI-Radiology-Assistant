import * as tf from "@tensorflow/tfjs";
import { jet } from "./colormaps";
import ImageSSIM from "image-ssim";
import Navbar from "./Navbar";
import { NAV_ITEMS } from "./constants";
import React, { useEffect, useState } from "react";
import PercentageSlider from "./PercentageSlider";
import Hero from "./Hero";

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
} from "@chakra-ui/react";

import axios from "axios";

const fetchData = async (disease, input) => {
  const response = await axios.post(
    "https://api.openai.com/v1/completions",
    {
      prompt: `Given this disease ${disease}, answer this question: "${input}"`,
      model: "text-davinci-002",
      max_tokens: 50,
      n: 1,
      stop: ".",
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer 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`,
      },
    }
  );

  return response.data.choices[0].text;
};

function App() {
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState({});
  const [aechesternet, setAechesternet] = useState(null);
  const [chesternet, setChesternet] = useState(null);
  let thispred = {};
  const [image, setImage] = useState(null);
  const [inp, setInp] = useState(null);
  const [rep, setRep] = useState("");

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
      model = await tf.loadGraphModel(model_path + "/model.json", cachedfetch);
    }
    // save model for next time
    try {
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

    thispred.img_input = thispred.img_resized
      .mul(2)
      .sub(1)
      .mul(tf.scalar(MODEL_CONFIG.IMAGE_SCALE));
  }

  const predict = async (imgElement, isDemo, filename) => {
    setLoading(true);
    //   prepare input image
    console.log("In predict");
    console.log("here is the image element:", imgElement);
    prepare_image(imgElement);

    // show the input image
    let img = document.getElementsByClassName("inputimage_highres");
    await tf.browser.toPixels(thispred.img_highres, img[0]);
    document.getElementsByClassName("inputimage_highres")[0].style.display = "";

    //  do predictions
    let img_small = document.createElement("img");
    img_small.src = imgElement.src;
    img_small.width = 64;
    img_small.height = 64;

    console.log("image source: " + img_small.src);

    let { recInput, recErr, rec } = tf.tidy(() => {
      console.log("In tf.tidy");
      let img = tf.browser.fromPixels(img_small);
      img = img.toFloat();

      const normalized = img.div(tf.scalar(255));

      let aebatched = normalized.mean(2).reshape([1, 1, 64, 64]);

      const rec = aechesternet.predict(aebatched);
      console.log(rec);

      const recErr = aebatched.sub(rec).abs();

      return { recInput: aebatched, recErr: recErr, rec: rec };
    });

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

    if (!can_predict) {
      showProbError(score);
      return;
    } else {
      let output = tf.tidy(() => {
        const batched = thispred.img_input.reshape([
          1,
          1,
          MODEL_CONFIG.IMAGE_SIZE,
          MODEL_CONFIG.IMAGE_SIZE,
        ]);
        return chesternet.execute(batched, [MODEL_CONFIG.OUTPUT_NODE]);
      });

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

      showProbResults(); //, logits, recScore)
      setLoading(false);

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

  function showProbResults() {
    let classes = thispred.classes;
    console.log(classes);
  }

  function showProbError(predictionContainer, score) {
    alert(
      "This image is too far out of our training distribution so we will not process it. (" +
        score +
        "). It could be that your image is not cropped correctly or it was aquired using a protocal that is not in our training data. "
    );
  }

  async function run_demo() {
    console.log("run_demo");

    var imgElement = new Image();
    imgElement.src = "examples/f410057190635755d60158d1595d67_jumbo-1.jpeg";

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
          console.log(img);
          console.log("NEW IMAGE ELEMENT FOUND");
          await predict(img, false, file.name);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  async function handleClick() {
    let re2 = await fetchData(selectedOption, inp);
    setRep(re2);
  }

  return (
    <>
      <Navbar navItems={NAV_ITEMS} loading={loading} />
      <Hero />
      <br />
      <br />
      <br />
      <br />
      <br />
      {/* <iframe
        title="test"
        src="https://mlmed.org/tools/xray/"
        width="100%"
        height="500"
        // turn off scrolling
        // scrolling="no"
      >
        Browser not compatible.
      </iframe> */}
      <Box borderWidth="1px" borderRadius="md" p={4}>
        <FormControl>
          <FormLabel>Upload an image</FormLabel>
          <Input type="file" onChange={handleImageChange} id="files" />
        </FormControl>
      </Box>
      <Box borderWidth="1px" borderRadius="md" p={4}>
        <Box display={"grid"} gridTemplateColumns="2fr 1fr">
          <VStack>
            <HStack mb={4}>
              {/* <Button>Invert Colors</Button> */}
              <Button>View Gradient Class Activation Map</Button>
              <Button>Reset</Button>
            </HStack>
            <Box className="viewbox">
              {loading && (
                <Spinner
                  className="layer loading"
                  position={"absolute"}
                  left="30%"
                  top="50%"
                  size={"xl"}
                />
              )}
              <canvas className="layer inputimage_highres baselayer"></canvas>
              <canvas
                className="layer inputimage"
                style={{ display: "none" }}
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
                className="layer gradimage"
                style={{ filter: "blur(0.89rem)" }}
              ></canvas>
              {/* <center
                className="layer loading"
                style={{ display: "none", marginTop: "5%", width: "100%" }}
              >
                <img
                  style={{ width: "400px" }}
                  alt="Loading..."
                  src="res/loading1.gif"
                />
              </center> */}
            </Box>
          </VStack>
          <Box>
            <Text fontSize="xl" fontWeight="bold" mb={4}>
              Pathology Risk
            </Text>
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
                    ].map((disease) => (
                      <Tr key={disease} my={10} py={10}>
                        <Td my={0} py={4}>
                          {disease}
                        </Td>
                        <Td my={0} py={4}>
                          {scores[disease]}
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
        <Box
          borderWidth="1px"
          borderRadius="md"
          p={10}
          position="relative"
          my="-40px"
        >
          <Select value={selectedOption} onChange={handleSelectChange}>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <Input value={inp} onChange={handleInpChange} />
          <Button colorScheme="blue" onClick={handleClick}>
            Submit Question
          </Button>
          <Textarea value={rep} />
        </Box>
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
