const { onRequest } = require("firebase-functions/v2/https");
const tnthai = require("tnthai");
const logger = require("firebase-functions/logger");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const REGION = "asia-east2";
admin.initializeApp();
const db = admin.firestore();

function isEmpty(checkValue) {
    if (checkValue === undefined || checkValue === null || checkValue === "" || checkValue + "" === "null") {
        return true;
    }
    return false;
}


exports.onWriteProductList = functions
    .region(REGION)
    .firestore.document("/product_list/{documentId}")
    .onWrite(async (snap, context) => {

        const data = snap.after.data();
        const before = snap.before.data();

        if (isEmpty(data)) {
            return;
        }

        //  อัพเดท tranfer_list ถ้ามันเปลี่ยน Category กัน
        if (!isEmpty(before)) {
            console.log("aaaa >>>>");
            if (data.category != before.category) {
                const rs = await db.collection('tranfer_list').where("product_ref", "==", snap.after.ref).get();
                for (var i = 0; i < rs.size; i++) {
                    db.doc(rs.docs[i].ref.path).update({ product_cate: data.category });
                }
            }
        }

        //  อัพเดท search_data เอาไว้ search
        console.log("bbbb >>>>");
        const analyzer = new tnthai();
        const segment1 = analyzer.segmenting(data.name, { multiSolution: true });
        let tmpArr = segment1.solution.flat();
        let wordArr = [...new Set(tmpArr)];
        console.log(wordArr);
        console.log("/////");
        wordArr.push(data.product_id);
        console.log(wordArr);
        await db.doc(snap.after.ref.path).update({ search_data: wordArr });




    });