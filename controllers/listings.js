const Listing = require("../models/listing");
const { cloudinary } = require("../cloudConfig.js");

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", {allListings});
};

module.exports.renderNewForm = (req, res) =>{
    
    res.render("listings/new.ejs")
};

module.exports.showListing = async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id).populate({ path:"reviews", populate: { path: "author",},}).populate("owner");
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    
    res.render("listings/show.ejs", {listing});
};


module.exports.createListing = async (req, res, next) => {
    try {
        console.log("Uploaded File:", req.file);

        if (!req.file) {
            req.flash("error", "Please upload an image!");
            return res.redirect("/listings/new");
        }

        // Upload image buffer to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "wanderlust_DEV",
                    resource_type: "image"
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );

            stream.end(req.file.buffer);
        });

        let url = result.secure_url;
        let filename = result.public_id;

        console.log("URL:", url);
        console.log("Filename:", filename);

        // Create new listing
        const newListing = new Listing(req.body.listing);

        newListing.owner = req.user._id;

        newListing.image = {
            url: url,
            filename: filename
        };

        // Save in MongoDB
        await newListing.save();

        req.flash("success", "New Listing Created!");
        res.redirect("/listings");

    } catch (err) {
        next(err);
    }
};
module.exports.renderEditForm = async (req,res) =>{
 let {id} = req.params;
 const listing = await Listing.findById(id);
  if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
 res.render("listings/edit.ejs", {listing});
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;

    let listing = await Listing.findByIdAndUpdate(
        id,
        { ...req.body.listing },
        { new: true }
    );

    if (req.file) {
        let result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: "wanderlust_DEV" },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );

            stream.end(req.file.buffer);
        });

        listing.image = {
            url: result.secure_url,
            filename: result.public_id
        };

        await listing.save();
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req,res) => {
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
     req.flash("success","A Listing Deleted!");
    res.redirect("/listings"); 
};