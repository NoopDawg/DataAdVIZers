class MiniLineChart {

    constructor(_parentElement, data)  {
        this.parentElementID = _parentElement;
        this.data = data;
        this.initVis();
    }

    initVis() {
        const self = this;
        self.element = document.getElementById(self.parentElementID);

        let bbox = self.element.getBoundingClientRect();
        console.log(bbox);


    }

    updateVis() {

    }
}